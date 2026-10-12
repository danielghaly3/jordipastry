import type { Metadata } from "next";
import { MenuBrowser } from "@/components/menu/menu-browser";
import { getCategories, getProducts } from "@/lib/data";

export const metadata: Metadata = { title: "Our Menu", description: "Browse our donuts, cinnamon rolls, cookies and cookie tarts. Order online in EGP." };

export default async function MenuPage({ searchParams }: { searchParams: Promise<{ category?: string; q?: string }> }) {
  const [{ category, q }, products, categories] = await Promise.all([searchParams, getProducts(), getCategories()]);
  const used = categories.filter((c) => products.some((p) => p.category_id === c.id));
  return (
    <div className="mx-auto max-w-[1240px] px-5 pb-10 pt-10 md:px-8 md:pt-14">
      <h1 className="font-display text-[clamp(2rem,4.8vw,3.4rem)] font-bold leading-[1.1] tracking-[-0.02em]">
        Our <span className="text-pink-ink">Menu</span>
      </h1>
      <p className="mt-3 max-w-xl text-lg text-cocoa-muted">Pick your favorites, or mix them in a box. Prices in EGP.</p>
      <MenuBrowser products={products} categories={used} initialCategory={category ?? ""} initialQuery={q ?? ""} />
    </div>
  );
}
