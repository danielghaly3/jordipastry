import { formatDateTime, formatEGP } from "./format";
import { ownerToCustomerMessage } from "./messages";
import { whatsappLink, prettyPhone } from "./phone";
import { PAYMENT_LABEL, PAYMENT_METHOD_LABEL, FULFILLMENT_ADMIN_LABEL } from "./status";
import type { Order, OrderItem } from "./types";

export type TelegramPayload = {
  text: string;
  reply_markup?: { inline_keyboard: { text: string; url: string }[][] };
};

export type OrderEvent = "order_created" | "payment_reported" | "order_canceled" | "needs_attention";

const HEADERS: Record<OrderEvent, string> = {
  order_created: "🍩 <b>NEW JORDI ORDER</b>",
  payment_reported: "💸 <b>PAYMENT REPORTED</b>",
  order_canceled: "❌ <b>ORDER CANCELED</b>",
  needs_attention: "⚠️ <b>ORDER NEEDS ATTENTION</b>",
};

export const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function itemLine(item: Pick<OrderItem, "quantity" | "name" | "options" | "box_contents">) {
  const opts = item.options.map((o) => o.name).join(", ");
  const box = item.box_contents.map((c) => `${c.quantity}× ${c.name}`).join(", ");
  return `${item.quantity} × ${item.name}${opts ? ` (${opts})` : ""}${box ? `: ${box}` : ""}`;
}

type PaymentInfo = { reference: string | null; has_receipt: boolean } | null;

export function buildOrderMessage(
  event: OrderEvent,
  order: Order,
  items: Pick<OrderItem, "quantity" | "name" | "options" | "box_contents">[],
  opts: { siteUrl: string; payment?: PaymentInfo; reason?: string },
): TelegramPayload {
  const e = escapeHtml;
  const lines = [HEADERS[event], ""];
  if (event === "payment_reported") {
    lines.push(`The customer says they sent <b>${formatEGP(order.total)}</b> via InstaPay.`);
    lines.push("Check your InstaPay app before confirming.");
    if (opts.payment?.reference) lines.push(`Reference: ${e(opts.payment.reference)}`);
    lines.push(`Receipt uploaded: ${opts.payment?.has_receipt ? "yes" : "no"}`, "");
  }
  if (event === "needs_attention" && opts.reason) lines.push(e(opts.reason), "");

  lines.push(`<b>Order:</b> #${e(order.order_number)}`);
  lines.push(`<b>Customer:</b> ${e(order.customer_name)}`);
  lines.push(`<b>Phone:</b> ${e(prettyPhone(order.customer_phone))}`);
  if (order.customer_whatsapp !== order.customer_phone) lines.push(`<b>WhatsApp:</b> ${e(order.customer_whatsapp)}`);

  if (event === "order_created" || event === "order_canceled") {
    lines.push("", "<b>Products:</b>", ...items.map((i) => `• ${e(itemLine(i))}`), "");
    if (order.delivery_fee > 0) lines.push(`Subtotal: ${formatEGP(order.subtotal)}`, `Delivery fee: ${formatEGP(order.delivery_fee)}`);
  } else {
    lines.push("");
  }
  lines.push(`<b>Total:</b> ${formatEGP(order.total)}`, "");
  lines.push(`<b>Payment:</b> ${PAYMENT_METHOD_LABEL[order.payment_method]}`);
  lines.push(`<b>Payment Status:</b> ${PAYMENT_LABEL[order.payment_status]}`);
  if (event !== "order_created") lines.push(`<b>Order Status:</b> ${FULFILLMENT_ADMIN_LABEL[order.fulfillment_status]}`);
  lines.push(
    order.fulfillment_method === "delivery"
      ? `<b>Delivery:</b> ${e(order.delivery_area_name ?? "")}, ${e(order.delivery_address ?? "")}`
      : "<b>Delivery:</b> Pickup",
  );
  if (order.requested_for) lines.push(`<b>Requested for:</b> ${formatDateTime(order.requested_for)}`);
  if (order.notes && event === "order_created") lines.push(`<b>Notes:</b> ${e(order.notes)}`);

  const buttons: { text: string; url: string }[][] = [];
  // Telegram rejects non-public URLs (e.g. localhost) in buttons.
  if (opts.siteUrl.startsWith("https://")) buttons.push([{ text: "📋 View Order", url: `${opts.siteUrl}/admin/orders/${order.id}` }]);
  buttons.push([{ text: "💬 WhatsApp Customer", url: whatsappLink(order.customer_whatsapp, ownerToCustomerMessage(order)) }]);

  return { text: lines.join("\n"), reply_markup: { inline_keyboard: buttons } };
}

export const telegramConfigured = () => Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);

/** Sends to the single private owner chat from env. Throws with a token-free error message on failure. */
export async function sendTelegram(payload: TelegramPayload) {
  const token = process.env.TELEGRAM_BOT_TOKEN ?? "";
  const chatId = process.env.TELEGRAM_CHAT_ID ?? "";
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, parse_mode: "HTML", link_preview_options: { is_disabled: true }, ...payload }),
      signal: AbortSignal.timeout(8000),
    });
    const json = (await res.json().catch(() => null)) as { ok?: boolean; description?: string } | null;
    if (!res.ok || !json?.ok) throw new Error(json?.description ?? `Telegram HTTP ${res.status}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(token ? message.replaceAll(token, "[token]") : message);
  }
}
