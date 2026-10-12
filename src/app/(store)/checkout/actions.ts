"use server";
import { after } from "next/server";
import { checkoutSchema, quoteSchema, type CheckoutInput, type Quote } from "@/lib/checkout-schema";
import { getPublicSettings } from "@/lib/data";
import { fail, friendlyError, ok, type ActionResult } from "@/lib/errors";
import { notifyOrderEvent } from "@/lib/notify";
import { normalizeEgyptPhone, normalizeWhatsApp } from "@/lib/phone";
import { clientIpHash, rateLimit } from "@/lib/rate-limit";
import { cairoToDate, isValidSlot } from "@/lib/schedule";
import { createServiceClient } from "@/lib/supabase/server";

/** Server-computed prices for the checkout summary (nothing is written). */
export async function quoteOrder(input: unknown): Promise<ActionResult<Quote>> {
  const parsed = quoteSchema.safeParse(input);
  if (!parsed.success) return fail("Some items in your cart are no longer valid. Please refresh the page.");
  if (!(await rateLimit("quote", 120, 600))) return fail("Too many requests. Please wait a moment.");
  const { data, error } = await createServiceClient().rpc("place_order", {
    p: { ...parsed.data, customer: {}, items: parsed.data.items },
    p_dry_run: true,
  });
  if (error) return fail(friendlyError(error));
  return ok(data as Quote);
}

export async function placeOrder(input: CheckoutInput): Promise<ActionResult<{ token: string }>> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return fail(issue?.path[0] === "website" ? "Something went wrong. Please try again." : issue?.message && !issue.message.startsWith("Invalid") ? issue.message : "Please check your details and try again.");
  }
  const d = parsed.data;

  const phone = normalizeEgyptPhone(d.phone);
  if (!phone) return fail("Please enter a valid Egyptian mobile number, like 010 1234 5678.");
  const whatsapp = d.whatsapp ? normalizeWhatsApp(d.whatsapp) : phone;
  if (!whatsapp) return fail("Please enter a valid WhatsApp number, or leave it empty to use your phone number.");

  let requestedFor: string | null = null;
  const { store } = await getPublicSettings();
  if (store.scheduling_enabled && d.requested_date && d.requested_time) {
    if (!isValidSlot(store, d.requested_date, d.requested_time)) return fail("That time slot isn't available anymore. Please pick another one.");
    requestedFor = cairoToDate(d.requested_date, d.requested_time).toISOString();
  }

  if (!(await rateLimit("order", 6, 600)) || !(await rateLimit("order_day", 15, 86400))) {
    return fail("Too many orders from this connection. Please wait a while or message us on WhatsApp.");
  }

  const { data, error } = await createServiceClient().rpc("place_order", {
    p: {
      idempotency_key: d.idempotency_key,
      customer: { name: d.name, phone, whatsapp },
      fulfillment_method: d.fulfillment_method,
      delivery_area_id: d.fulfillment_method === "delivery" ? d.delivery_area_id : null,
      delivery_address: d.fulfillment_method === "delivery" ? d.delivery_address : null,
      requested_for: requestedFor,
      notes: d.notes,
      payment_method: d.payment_method,
      items: d.items,
      ip_hash: await clientIpHash(),
    },
  });
  if (error) {
    if (!error.message.match(/^[A-Z_]+$/)) console.error("place_order failed", error.code, error.message);
    return fail(friendlyError(error, "We couldn't place your order. Please try again."));
  }
  const result = data as { order_id: string; token: string; duplicate: boolean };
  if (!result.duplicate) after(() => notifyOrderEvent(result.order_id, "order_created"));
  return ok({ token: result.token });
}
