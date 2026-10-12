import type { Metadata } from "next";
import { BoxManager } from "@/components/admin/box-manager";
import { PageHeader } from "@/components/admin/ui";
import { adminBoxes, adminProducts } from "@/lib/admin-products";
import { requireAdmin } from "@/lib/auth";
import { getPublicSettings } from "@/lib/data";

export const metadata: Metadata = { title: "Donut Boxes" };

export default async function BoxesPage() {
  const { supabase } = await requireAdmin();
  const [boxes, products, { store }] = await Promise.all([adminBoxes(supabase), adminProducts(supabase), getPublicSettings()]);
  return (
    <>
      <PageHeader title="Donut Boxes" description="Box sizes, prices and which flavors customers can pick." />
      <BoxManager boxes={boxes} products={products.filter((p) => !p.archived_at)} enabled={store.custom_boxes_enabled} />
    </>
  );
}
