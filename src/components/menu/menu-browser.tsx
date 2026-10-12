"use client";
import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Mascot } from "@/components/brand/mascot";
import { Medallion, Ribbon, categoryIcon } from "@/components/brand/ribbon";
import { ProductCard } from "@/components/store/product-card";
import type { Category, Product } from "@/lib/types";

function MenuCardSection({ title, slug, products, preload = false }: { title: string; slug: string; products: Product[]; preload?: boolean }) {
  return (
    <section id={`cat-${slug}`} className="scroll-mt-40 text-center" aria-labelledby={`h-${slug}`}>
      <Medallion icon={categoryIcon(`${slug} ${title}`)} />
      <Ribbon id={`h-${slug}`} className="-mt-3">{title}</Ribbon>
      <ul className="mt-8 grid grid-cols-1 gap-5 min-[500px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product, index) => (
          <li key={product.id} className="min-w-0 text-left">
            <ProductCard product={product} priority={preload && index < 4} showArabic />
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Reads ?category= and ?q= in the browser so the menu page itself can be served from cache. */
export function MenuBrowserFromUrl(props: { products: Product[]; categories: Category[] }) {
  const sp = useSearchParams();
  return <MenuBrowser {...props} initialCategory={sp.get("category") ?? ""} initialQuery={sp.get("q") ?? ""} />;
}

export function MenuBrowser({ products, categories, initialCategory, initialQuery }: {
  products: Product[]; categories: Category[]; initialCategory: string; initialQuery: string;
}) {
  const router = useRouter();
  const path = usePathname();
  const [category, setCategory] = useState(initialCategory);
  const [query, setQuery] = useState(initialQuery);

  const sync = (c: string, q: string) => {
    const sp = new URLSearchParams();
    if (c) sp.set("category", c);
    if (q) sp.set("q", q);
    router.replace(`${path}${sp.size ? `?${sp}` : ""}`, { scroll: false });
  };

  // Product-card groups in category order; search matches English or Arabic names and flavors.
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = (p: Product) => !q || `${p.name} ${p.name_ar ?? ""} ${p.flavor ?? ""} ${p.description}`.toLowerCase().includes(q);
    const list = categories
      .filter((c) => !category || c.slug === category)
      .map((c) => ({ title: c.name, slug: c.slug, products: products.filter((p) => p.category_id === c.id && match(p)) }));
    const loose = products.filter((p) => !p.category_id && match(p));
    if (!category && loose.length) list.push({ title: "More treats", slug: "more", products: loose });
    return list.filter((g) => g.products.length > 0);
  }, [products, categories, category, query]);
  const count = groups.reduce((n, g) => n + g.products.length, 0);

  const chip = (active: boolean) =>
    `h-11 shrink-0 rounded-full px-5 text-[15px] font-semibold transition ${active ? "bg-pink-ink text-white" : "bg-white text-cocoa ring-1 ring-line hover:bg-pink-tint"}`;

  return (
    <>
      <div className="sticky top-[88px] z-20 -mx-5 mt-8 bg-cream/95 px-5 py-3 backdrop-blur md:static md:mx-0 md:bg-transparent md:px-0 md:backdrop-blur-none">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="no-scrollbar flex gap-2 overflow-x-auto" role="group" aria-label="Filter by category">
            <button type="button" className={chip(!category)} aria-pressed={!category} onClick={() => { setCategory(""); sync("", query); }}>All</button>
            {categories.map((c) => (
              <button key={c.id} type="button" className={chip(category === c.slug)} aria-pressed={category === c.slug} onClick={() => { setCategory(c.slug); sync(c.slug, query); }}>
                {c.name}
              </button>
            ))}
          </div>
          <label className="relative block md:w-72">
            <span className="sr-only">Search the menu</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-cocoa-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => { setQuery(e.target.value); sync(category, e.target.value); }}
              placeholder="Search · ابحث"
              className="h-12 w-full rounded-full bg-white pl-12 pr-11 text-[15px] text-cocoa ring-1 ring-line placeholder:text-cocoa-muted focus:outline-none focus:ring-2 focus:ring-pink-ink"
            />
            {query && (
              <button type="button" onClick={() => { setQuery(""); sync(category, ""); }} className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full hover:bg-pink-tint" aria-label="Clear search">
                <X className="h-4 w-4" />
              </button>
            )}
          </label>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">{count} items shown</p>
      {groups.length === 0 ? (
        <div className="mt-16 rounded-[28px] bg-white p-10 text-center shadow-cloud">
          <Mascot pose="searching" className="mx-auto mb-4 h-24 w-24" />
          <p className="font-display text-2xl font-semibold">Nothing matches that</p>
          <p className="mt-2 text-cocoa-muted">Try another word or show the whole menu.</p>
          <button type="button" className="mt-5 font-semibold text-pink-ink underline" onClick={() => { setCategory(""); setQuery(""); sync("", ""); }}>Show everything</button>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-[minmax(0,1fr)] gap-16 md:gap-20">
          {groups.map((g, index) => <MenuCardSection key={g.slug} {...g} preload={index === 0} />)}
        </div>
      )}
    </>
  );
}
