import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { adminBoxes, adminCategories } from "@/lib/admin-products";
import { requireAdmin } from "@/lib/auth";
import { normalizeProduct, PRODUCT_SELECT } from "@/lib/data";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const { supabase } = await requireAdmin();
  const [{ data }, categories, boxes] = await Promise.all([
    supabase.from("products").select(PRODUCT_SELECT).eq("id", id).maybeSingle(),
    adminCategories(supabase),
    adminBoxes(supabase),
  ]);
  if (!data) notFound();
  const product = normalizeProduct(data as unknown as Record<string, unknown>);
  return <ProductForm key={product.id + product.name} product={product} categories={categories} boxes={boxes} />;
}
