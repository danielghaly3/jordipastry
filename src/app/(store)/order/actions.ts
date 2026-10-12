"use server";
import { after } from "next/server";
import { z } from "zod";
import { getOrderByToken } from "@/lib/data";
import { fail, friendlyError, ok, type ActionResult } from "@/lib/errors";
import { notifyOrderEvent } from "@/lib/notify";
import { clientIpHash, rateLimit } from "@/lib/rate-limit";
import { CARD_STYLES, TREATS } from "@/lib/review-cards";
import { createServiceClient } from "@/lib/supabase/server";

const token = z.string().regex(/^[a-f0-9]{64}$/);
const RECEIPT_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf" };

/** Short-lived signed URL so the customer can upload a receipt straight to the private bucket. */
export async function createReceiptUpload(t: string, contentType: string): Promise<ActionResult<{ path: string; uploadToken: string }>> {
  if (!token.safeParse(t).success || !RECEIPT_TYPES[contentType]) return fail("Please upload a photo (JPG, PNG, WebP) or a PDF.");
  if (!(await rateLimit("receipt", 6, 600))) return fail("Too many uploads. Please wait a few minutes.");
  const order = await getOrderByToken(t);
  if (!order) return fail(friendlyError({ message: "ORDER_NOT_FOUND" }));
  if (order.payment_method !== "instapay" || order.fulfillment_status === "canceled" || !["pending", "rejected"].includes(order.payment_status)) {
    return fail("This order doesn't need a receipt right now.");
  }
  const path = `${order.id}/${crypto.randomUUID()}.${RECEIPT_TYPES[contentType]}`;
  const { data, error } = await createServiceClient().storage.from("payment-receipts").createSignedUploadUrl(path);
  if (error || !data) return fail("Upload isn't available right now. You can still report your payment without a receipt.");
  return ok({ path, uploadToken: data.token });
}

const reportSchema = z.object({ token, reference: z.string().trim().max(120).optional().default(""), receiptPath: z.string().max(200).nullable().optional() });

export async function reportPayment(input: z.input<typeof reportSchema>): Promise<ActionResult<{ changed: boolean }>> {
  const parsed = reportSchema.safeParse(input);
  if (!parsed.success) return fail("Please check the reference and try again.");
  if (!(await rateLimit("report", 10, 600))) return fail("Too many attempts. Please wait a few minutes.");
  const { token: t, reference, receiptPath } = parsed.data;
  const { data, error } = await createServiceClient().rpc("report_payment", { p_token: t, p_reference: reference, p_receipt_path: receiptPath ?? null });
  if (error) return fail(friendlyError(error));
  const r = data as { changed: boolean; order_id: string; report_count?: number };
  // One alert per report (a re-report after a rejection gets its own alert)
  if (r.changed) after(() => notifyOrderEvent(r.order_id, "payment_reported", r.report_count && r.report_count > 1 ? `_${r.report_count}` : ""));
  return ok({ changed: r.changed });
}

const reviewSchema = z.object({ token, name: z.string().trim().min(1).max(40), rating: z.number().int().min(1).max(5), body: z.string().trim().min(3).max(400) });

export async function submitReview(input: z.input<typeof reviewSchema>): Promise<ActionResult<null>> {
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return fail("Please add a rating and a few words.");
  if (!(await rateLimit("review", 5, 3600))) return fail("Too many attempts. Please try later.");
  const d = parsed.data;
  const { error } = await createServiceClient().rpc("submit_review", { p_token: d.token, p_name: d.name, p_rating: d.rating, p_body: d.body });
  return error ? fail(friendlyError(error)) : ok(null);
}

const publicReviewSchema = z.object({
  name: z.string().trim().min(2, "Please add your name").max(40),
  rating: z.number().int().min(1, "Please choose a rating").max(5),
  body: z.string().trim().min(3, "Please write a few words").max(400),
  website: z.string().max(0).optional().default(""), // honeypot
  cardStyle: z.enum(CARD_STYLES.map((c) => c.id)).default("classic"),
  treat: z.enum(TREATS.map((t) => t.id)).default("donut"),
});

/** Homepage review: published immediately (owner can hide or delete it in the dashboard). */
export async function postPublicReview(input: z.input<typeof publicReviewSchema>): Promise<ActionResult<null>> {
  const parsed = publicReviewSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return fail(issue?.path[0] === "website" ? "Something went wrong. Please try again." : issue?.message ?? "Please check your review.");
  }
  if (!(await rateLimit("public_review", 3, 86400))) return fail("Thanks! You've already shared a few reviews today.");
  const d = parsed.data;
  const { error } = await createServiceClient().rpc("post_public_review", { p_name: d.name, p_rating: d.rating, p_body: d.body, p_ip_hash: await clientIpHash(), p_card_style: d.cardStyle, p_treat: d.treat });
  return error ? fail(friendlyError(error)) : ok(null);
}
