import "server-only";
import { cache } from "react";
import { isSupabaseConfigured } from "@/lib/env";
import { readSetting, type PublicSettings } from "@/lib/settings";
import { createPublicClient, createServiceClient } from "@/lib/supabase/server";
import type { BoxSize, Category, DeliveryArea, Order, OrderItem, Product, Review } from "@/lib/types";

// Store pages are prerendered (ISR, revalidate in app/layout.tsx), so these run at build/revalidation
// time, not per visit. Anything that changes what customers see must call revalidatePath("/", ...).

export const PRODUCT_SELECT =
  "id,slug,name,name_ar,description,price,sale_price,flavor,ingredients,allergens,is_visible,is_sold_out,is_featured,stock_quantity,box_surcharge,sort_order,is_sample,archived_at,category_id," +
  "category:categories(id,name,slug),images:product_images(id,storage_path,alt,sort_order),options:product_options(id,kind,name,price_delta,is_available,sort_order)";

const bySort = <T extends { sort_order: number }>(a: T, b: T) => a.sort_order - b.sort_order;

export function normalizeProduct(row: Record<string, unknown>): Product {
  const p = row as unknown as Product;
  return {
    ...p,
    price: Number(p.price),
    sale_price: p.sale_price === null ? null : Number(p.sale_price),
    box_surcharge: Number(p.box_surcharge),
    images: [...(p.images ?? [])].sort(bySort),
    options: [...(p.options ?? [])].map((o) => ({ ...o, price_delta: Number(o.price_delta) })).sort(bySort),
  };
}

export const getPublicSettings = cache(async (): Promise<PublicSettings> => {
  const map: Record<string, unknown> = {};
  if (isSupabaseConfigured) {
    const { data, error } = await createPublicClient().from("site_settings").select("key,value");
    if (error) console.error("settings load failed", error.message);
    for (const row of data ?? []) map[row.key] = row.value;
  }
  return {
    store: readSetting("store", map.store),
    branding: readSetting("branding", map.branding),
    homepage: readSetting("homepage", map.homepage),
    about: readSetting("about", map.about),
    contact: readSetting("contact", map.contact),
    announcement: readSetting("announcement", map.announcement),
  };
});

export async function getPrivateSetting<K extends "instapay" | "pickup">(key: K) {
  const { data } = await createServiceClient().from("site_settings").select("value").eq("key", key).maybeSingle();
  return readSetting(key, data?.value);
}

export const getCategories = cache(async (): Promise<Category[]> => {
  const { data } = await createPublicClient().from("categories").select("id,name,slug,sort_order,is_visible").order("sort_order").order("name");
  return data ?? [];
});

export const getProducts = cache(async (): Promise<Product[]> => {
  const { data, error } = await createPublicClient().from("products").select(PRODUCT_SELECT).order("sort_order").order("name");
  if (error) throw new Error(`Could not load products: ${error.message}`);
  return (data ?? []).map((r) => normalizeProduct(r as unknown as Record<string, unknown>));
});

export async function getProductBySlug(slug: string) {
  const { data } = await createPublicClient().from("products").select(PRODUCT_SELECT).eq("slug", slug).maybeSingle();
  return data ? normalizeProduct(data as unknown as Record<string, unknown>) : null;
}

export const getBoxSizes = cache(async (): Promise<BoxSize[]> => {
  const { data } = await createPublicClient()
    .from("box_sizes")
    .select("id,name,description,slots,price,is_active,sort_order,eligible:box_eligible_products(product_id)")
    .order("sort_order");
  return (data ?? []).map((b) => ({
    ...b,
    price: Number(b.price),
    eligible: (b.eligible as { product_id: string }[]).map((e) => e.product_id),
  }));
});

export const getDeliveryAreas = cache(async (): Promise<DeliveryArea[]> => {
  const { data } = await createPublicClient().from("delivery_areas").select("id,name,fee,is_active,sort_order").order("sort_order").order("name");
  return (data ?? []).map((a) => ({ ...a, fee: Number(a.fee) }));
});

/** Real best sellers from order history; empty when there are no sales yet. */
export async function getBestSellers(products: Product[]) {
  const { data } = await createPublicClient().rpc("best_seller_ids", { p_limit: 8 });
  const ids = ((data ?? []) as { product_id: string }[]).map((r) => r.product_id);
  return ids.map((id) => products.find((p) => p.id === id)).filter((p): p is Product => Boolean(p));
}

export async function getApprovedReviews(): Promise<Review[]> {
  const { data } = await createPublicClient()
    .from("reviews")
    .select("id,display_name,rating,body,created_at,verified,card_style,treat")
    .eq("is_approved", true)
    .order("created_at", { ascending: false })
    .limit(24); // newest first: a just-posted review appears straight away
  return data ?? [];
}

export type TrackedOrder = Order & {
  items: OrderItem[];
  history: { kind: string; to_status: string; note: string | null; created_at: string }[];
  payment: { reference: string | null; rejection_reason: string | null; has_receipt: boolean; reported_at: string | null } | null;
  has_review: boolean;
};

/** Customer view of an order, looked up by its unguessable token. */
export async function getOrderByToken(token: string): Promise<TrackedOrder | null> {
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  const { data } = await createServiceClient()
    .from("orders")
    .select(
      "*,items:order_items(*),history:order_status_history(kind,to_status,note,created_at)," +
        "payments:payment_records(reference,rejection_reason,receipt_path,reported_at,created_at),reviews(id)",
    )
    .eq("public_token", token)
    .maybeSingle();
  if (!data) return null;
  const row = data as unknown as Order & {
    items: OrderItem[];
    history: TrackedOrder["history"];
    payments: { reference: string | null; rejection_reason: string | null; receipt_path: string | null; reported_at: string | null; created_at: string }[];
    reviews: unknown;
  };
  const latest = [...row.payments].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  const { payments, reviews, ...order } = row;
  void payments;
  return {
    ...order,
    subtotal: Number(order.subtotal),
    delivery_fee: Number(order.delivery_fee),
    total: Number(order.total),
    items: row.items.map((i) => ({ ...i, unit_price: Number(i.unit_price), line_total: Number(i.line_total) })),
    history: [...row.history].sort((a, b) => a.created_at.localeCompare(b.created_at)),
    payment: latest
      ? { reference: latest.reference, rejection_reason: latest.rejection_reason, has_receipt: Boolean(latest.receipt_path), reported_at: latest.reported_at }
      : null,
    has_review: Array.isArray(reviews) ? reviews.length > 0 : Boolean(reviews),
  };
}
