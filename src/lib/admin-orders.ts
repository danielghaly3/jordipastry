import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cairoToDate } from "@/lib/schedule";
import type { FulfillmentStatus, PaymentStatus } from "@/lib/types";

export type OrderFilters = { q?: string; payment?: string; status?: string; from?: string; to?: string; view?: string };

export const ORDER_LIST_SELECT = "id,order_number,customer_name,customer_phone,total,payment_status,fulfillment_status,fulfillment_method,payment_method,created_at,requested_for,delivery_area_name";

/** Applies the Orders page filters to a query (shared by the list and the CSV export). */
export function applyOrderFilters<T extends { or: (f: string) => T; eq: (c: string, v: string) => T; gte: (c: string, v: string) => T; lt: (c: string, v: string) => T; in: (c: string, v: string[]) => T; neq: (c: string, v: string) => T }>(query: T, f: OrderFilters) {
  let q = query;
  // Keep only safe characters so the text can't break PostgREST's filter syntax.
  const term = (f.q ?? "").replace(/[^\p{L}\p{N}\s+-]/gu, "").trim().slice(0, 60);
  if (term) {
    const digits = term.replace(/\D/g, "").replace(/^0/, "");
    const parts = [`order_number.ilike.*${term}*`, `customer_name.ilike.*${term}*`];
    if (digits.length >= 4) parts.push(`customer_phone.like.*${digits}*`);
    q = q.or(parts.join(","));
  }
  if (f.view === "action") q = q.or("fulfillment_status.eq.received,and(payment_status.eq.reported,fulfillment_status.neq.canceled)");
  if (f.view === "active") q = q.in("fulfillment_status", ["received", "preparing", "ready", "out_for_delivery"]);
  if (f.payment && ["pending", "reported", "verified", "rejected", "refunded"].includes(f.payment)) q = q.eq("payment_status", f.payment as PaymentStatus);
  if (f.status && ["received", "preparing", "ready", "out_for_delivery", "completed", "canceled"].includes(f.status)) q = q.eq("fulfillment_status", f.status as FulfillmentStatus);
  if (f.from && /^\d{4}-\d{2}-\d{2}$/.test(f.from)) q = q.gte("created_at", cairoToDate(f.from, "00:00").toISOString());
  if (f.to && /^\d{4}-\d{2}-\d{2}$/.test(f.to)) q = q.lt("created_at", new Date(cairoToDate(f.to, "00:00").getTime() + 86_400_000).toISOString());
  return q;
}

export async function listOrders(supabase: SupabaseClient, f: OrderFilters, limit = 50, offset = 0) {
  const base = supabase.from("orders").select(ORDER_LIST_SELECT, { count: "exact" });
  const { data, count, error } = await applyOrderFilters(base, f).order("created_at", { ascending: false }).range(offset, offset + limit - 1);
  if (error) throw new Error(error.message);
  return { orders: (data ?? []).map((o) => ({ ...o, total: Number(o.total) })), count: count ?? 0 };
}
export type OrderRow = Awaited<ReturnType<typeof listOrders>>["orders"][number];
