import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { ProductManager } from "@/components/admin/product-manager";
import { PageHeader } from "@/components/admin/ui";
import { btn } from "@/components/ui/button";
import { adminCategories, adminProducts } from "@/lib/admin-products";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Products" };

export default async function ProductsPage() {
  const { supabase } = await requireAdmin();
  const [products, categories] = await Promise.all([adminProducts(supabase), adminCategories(supabase)]);
  return (
    <>
      <PageHeader
        title="Products"
        description="Tap a switch to mark something sold out or hide it. Changes show on the website right away."
        actions={<Link href="/admin/products/new" className={btn("primary", "md")}><Plus className="h-4 w-4" /> Add Product</Link>}
      />
      <ProductManager products={products} categories={categories} />
    </>
  );
}
