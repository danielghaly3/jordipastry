import type { Metadata } from "next";
import { CategoryManager } from "@/components/admin/category-manager";
import { PageHeader } from "@/components/admin/ui";
import { adminCategories } from "@/lib/admin-products";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const { supabase } = await requireAdmin();
  const [categories, { data: products }] = await Promise.all([adminCategories(supabase), supabase.from("products").select("category_id").is("archived_at", null)]);
  const counts: Record<string, number> = {};
  for (const p of products ?? []) if (p.category_id) counts[p.category_id] = (counts[p.category_id] ?? 0) + 1;
  return (
    <>
      <PageHeader title="Categories" description="Group your menu. Rename by typing, then tap anywhere else to save." />
      <CategoryManager key={categories.map((c) => c.id + c.name).join()} categories={categories} counts={counts} />
    </>
  );
}
