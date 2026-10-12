import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeProduct, PRODUCT_SELECT } from "@/lib/data";
import type { BoxSize, Category, Product } from "@/lib/types";

export async function adminProducts(sb: SupabaseClient) {
  const { data } = await sb.from("products").select(PRODUCT_SELECT).order("sort_order").order("name");
  return (data ?? []).map((r) => normalizeProduct(r as unknown as Record<string, unknown>)) as Product[];
}
export async function adminCategories(sb: SupabaseClient): Promise<Category[]> {
  const { data } = await sb.from("categories").select("id,name,slug,sort_order,is_visible").order("sort_order").order("name");
  return data ?? [];
}
export async function adminBoxes(sb: SupabaseClient): Promise<BoxSize[]> {
  const { data } = await sb.from("box_sizes").select("id,name,description,slots,price,is_active,sort_order,eligible:box_eligible_products(product_id)").order("sort_order");
  return (data ?? []).map((b) => ({ ...b, price: Number(b.price), eligible: (b.eligible as { product_id: string }[]).map((e) => e.product_id) }));
}
