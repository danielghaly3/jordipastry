import "server-only";
import { SITE_URL } from "@/lib/env";
import { createServiceClient } from "@/lib/supabase/server";
import { buildOrderMessage, sendTelegram, telegramConfigured, type OrderEvent, type TelegramPayload } from "@/lib/telegram";
import type { Order, OrderItem } from "@/lib/types";

type Log = { id: string; attempts: number; payload: TelegramPayload };

async function deliver(log: Log) {
  const db = createServiceClient();
  if (!telegramConfigured()) {
    await db.from("notification_logs").update({ status: "skipped", last_error: "Telegram is not configured" }).eq("id", log.id);
    return false;
  }
  try {
    await sendTelegram(log.payload);
    await db.from("notification_logs").update({ status: "sent", sent_at: new Date().toISOString(), attempts: log.attempts + 1, last_error: null }).eq("id", log.id);
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("telegram delivery failed", log.id, message);
    await db.from("notification_logs").update({ status: "failed", attempts: log.attempts + 1, last_error: message.slice(0, 300) }).eq("id", log.id);
    return false;
  }
}

/**
 * Sends one owner alert per (order, event). Never throws: an order is already saved when this runs,
 * and a Telegram outage must not affect the customer. Failures stay in notification_logs for retry.
 */
export async function notifyOrderEvent(orderId: string, event: OrderEvent, dedupeSuffix = "", reason?: string) {
  try {
    const db = createServiceClient();
    const { data: log, error } = await db
      .from("notification_logs")
      .insert({ order_id: orderId, event: event + dedupeSuffix, status: "pending" })
      .select("id")
      .single();
    if (error) {
      if (error.code !== "23505") console.error("notification log insert failed", error.message);
      return; // 23505 = already notified for this event
    }
    const { data: order } = await db
      .from("orders")
      .select("*,items:order_items(quantity,name,options,box_contents),payments:payment_records(reference,receipt_path,created_at)")
      .eq("id", orderId)
      .single();
    if (!order) return;
    const o = order as unknown as Order & { items: OrderItem[]; payments: { reference: string | null; receipt_path: string | null; created_at: string }[] };
    const latest = [...o.payments].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
    const payload = buildOrderMessage(event, { ...o, subtotal: Number(o.subtotal), delivery_fee: Number(o.delivery_fee), total: Number(o.total) }, o.items, {
      siteUrl: SITE_URL,
      payment: latest ? { reference: latest.reference, has_receipt: Boolean(latest.receipt_path) } : null,
      reason,
    });
    await db.from("notification_logs").update({ payload }).eq("id", log.id);
    await deliver({ id: log.id, attempts: 0, payload });
  } catch (err) {
    console.error("notifyOrderEvent failed", err instanceof Error ? err.message : err);
  }
}

export async function retryNotification(logId: string) {
  const { data } = await createServiceClient().from("notification_logs").select("id,attempts,payload").eq("id", logId).single();
  if (!data?.payload || !(data.payload as TelegramPayload).text) return false;
  return deliver(data as Log);
}

export async function sendTestNotification() {
  const payload: TelegramPayload = {
    text: "🍩 <b>Jordi Pastry test notification</b>\n\nIf you can read this, new-order alerts will arrive in this chat.",
    reply_markup: SITE_URL.startsWith("https://") ? { inline_keyboard: [[{ text: "📋 Open dashboard", url: `${SITE_URL}/admin` }]] } : undefined,
  };
  const { data } = await createServiceClient()
    .from("notification_logs")
    .insert({ event: `test_${Date.now()}`, status: "pending", payload })
    .select("id,attempts,payload")
    .single();
  return data ? deliver(data as Log) : false;
}
