import type { Metadata } from "next";
import { ProductForm } from "@/components/admin/product-form";
import { adminBoxes, adminCategories } from "@/lib/admin-products";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Add product" };

export default async function NewProductPage() {
  const { supabase } = await requireAdmin();
  const [categories, boxes] = await Promise.all([adminCategories(supabase), adminBoxes(supabase)]);
  return <ProductForm categories={categories} boxes={boxes} />;
}
