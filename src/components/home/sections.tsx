import Link from "next/link";
import { ArrowRight, Bike, CreditCard, HandHeart, MapPinned, PackageOpen, Star, Store } from "lucide-react";
import { DonutArt } from "@/components/brand/donut-art";
import { AutoRail } from "@/components/home/auto-rail";
import { BoxVisual } from "@/components/home/box-visual";
import { Reveal } from "@/components/home/reveal";
import { ProductCard } from "@/components/store/product-card";
import { btn } from "@/components/ui/button";
import { formatEGP } from "@/lib/format";
import type { PublicSettings } from "@/lib/settings";
import type { BoxSize, Category, Product } from "@/lib/types";

export function SectionTitle({ title, sub, center = false }: { title: string; sub?: string; center?: boolean }) {
  return (
    <div className={center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <h2 className="font-display text-[clamp(1.6rem,3.4vw,2.6rem)] font-bold leading-[1.1] tracking-[-0.015em]">{title}</h2>
      {sub && <p className="mt-3 text-lg text-cocoa-muted">{sub}</p>}
    </div>
  );
}

const wrap = "mx-auto max-w-[1240px] px-5 md:px-8";

export function BestSellers({ products, real }: { products: Product[]; real: boolean }) {
  if (products.length === 0) return null;
  return (
    <section className="py-16 md:py-20" aria-labelledby="best-title">
      <div className={`${wrap} flex flex-wrap items-end justify-between gap-4`}>
        <div id="best-title">
          <SectionTitle title={real ? "Best Sellers" : "Fresh Picks"} sub={real ? "The treats our customers order most." : "A few favorites from across our menu to start with."} />
        </div>
        <Link href="/menu" className={btn("secondary", "md")}>Full menu <ArrowRight className="h-4 w-4" /></Link>
      </div>
      <AutoRail label={real ? "Best sellers" : "Fresh picks"} items={products.map((p) => <ProductCard key={p.id} product={p} />)} />
    </section>
  );
}

const TILE_STYLES = [
  "bg-pink-ink text-white [&_.count]:text-white",
  "bg-accent-ink text-white [&_.count]:text-white",
  "bg-white text-cocoa ring-1 ring-line",
  "bg-pink-soft text-cocoa",
  "bg-cocoa text-cream [&_.count]:text-cream/80",
];

/**
 * Bento spans so the grid never has an empty cell. The first tile is the big one;
 * the last tile widens to absorb leftover cells. Tablet = 2 columns, desktop = 4.
 */
export function bentoSpan(i: number, n: number) {
  const rest = n - 1;
  const span = (cols: number, first: [number, number], restSpan: (i: number) => [number, number]) => {
    if (n === 1) return [cols, 1];
    return i === 0 ? first : restSpan(i);
  };
  const sm = span(2, [1, 2], (i) => {
    if (rest === 1) return [1, 2];
    return i === n - 1 && rest > 2 && (rest - 2) % 2 === 1 ? [2, 1] : [1, 1];
  });
  const lg = span(4, [2, 2], (i) => {
    if (rest === 1) return [2, 2];
    if (rest === 2) return [2, 1];
    if (rest === 3) return i === n - 1 ? [2, 1] : [1, 1];
    const rem = (rest - 4) % 4;
    return rest > 4 && rem && i === n - 1 ? [5 - rem, 1] : [1, 1];
  });
  return `${SM_COL[sm[0]]} ${SM_ROW[sm[1]]} ${LG_COL[lg[0]]} ${LG_ROW[lg[1]]}`;
}
// Full class names so Tailwind can see them.
const SM_COL: Record<number, string> = { 1: "sm:col-span-1", 2: "sm:col-span-2" };
const SM_ROW: Record<number, string> = { 1: "sm:row-span-1", 2: "sm:row-span-2" };
const LG_COL: Record<number, string> = { 1: "lg:col-span-1", 2: "lg:col-span-2", 3: "lg:col-span-3", 4: "lg:col-span-4" };
const LG_ROW: Record<number, string> = { 1: "lg:row-span-1", 2: "lg:row-span-2" };

export function Flavors({ categories, products }: { categories: Category[]; products: Product[] }) {
  const tiles = categories
    .map((c) => ({ ...c, items: products.filter((p) => p.category_id === c.id) }))
    .filter((c) => c.items.length > 0);
  if (tiles.length === 0) return null;
  return (
    <section id="flavors" className={`${wrap} scroll-mt-28 py-16 md:py-20`} aria-labelledby="flavors-title">
      <div id="flavors-title"><SectionTitle title="Explore Our Menu" sub={`${new Intl.ListFormat("en").format(tiles.map((t) => t.name))}. Pick a shelf and dig in.`} /></div>
      <ul className="mt-10 grid auto-rows-[200px] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((c, i) => (
          <li key={c.id} className={bentoSpan(i, tiles.length)}>
            <Link
              href={`/menu?category=${c.slug}`}
              className={`group relative flex h-full overflow-hidden rounded-[28px] p-6 transition hover:-translate-y-1 hover:shadow-lift ${TILE_STYLES[i % TILE_STYLES.length]}`}
            >
              <div className="relative z-10 flex flex-col">
                <span className={`font-display font-bold leading-tight ${i === 0 ? "text-4xl md:text-5xl" : "text-2xl"}`}>{c.name}</span>
                <span className="count mt-1 text-sm font-semibold opacity-90">{c.items.length} on the menu</span>
                <span className="mt-auto inline-flex items-center gap-1 text-sm font-bold">Shop now <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
              </div>
              <div className={`pointer-events-none absolute ${i === 0 ? "-bottom-6 -right-6 h-[70%] w-[70%]" : "-bottom-5 -right-5 h-[62%] w-[52%]"}`} aria-hidden="true">
                {c.items.slice(0, 3).map((p, j) => (
                  <DonutArt
                    key={p.id}
                    name={p.name}
                    flavor={p.flavor}
                    title=""
                    className={`absolute h-[62%] w-[62%] transition duration-500 group-hover:rotate-12 ${["bottom-0 right-0", "bottom-[30%] right-[38%] scale-75", "bottom-[52%] right-[2%] scale-[0.6]"][j]}`}
                  />
                ))}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function BoxTeaser({ boxes, products }: { boxes: BoxSize[]; products: Product[] }) {
  if (boxes.length === 0) return null;
  const featured = boxes[Math.min(1, boxes.length - 1)];
  const flavors = products.filter((p) => featured.eligible.includes(p.id)).map((p) => ({ name: p.name, flavor: p.flavor }));
  return (
    <section className="bg-white py-16 md:py-24" aria-labelledby="box-title">
      <div className={`${wrap} grid items-center gap-12 lg:grid-cols-2`}>
        <Reveal>
          <div id="box-title"><SectionTitle title="Build Your Donut Box" sub="Choose a box, fill every slot with the flavors you love, and we pack it fresh." /></div>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {boxes.map((b) => (
              <li key={b.id}>
                <Link href={`/build-a-box?size=${b.id}`} className="flex items-center justify-between gap-3 rounded-full bg-cream px-6 py-4 ring-1 ring-line transition hover:bg-pink-tint hover:ring-pink-soft">
                  <span className="flex items-center gap-3">
                    <PackageOpen className="h-5 w-5 text-pink-ink" />
                    <span className="font-display text-lg font-semibold">{b.name}</span>
                  </span>
                  <span className="font-semibold text-accent-ink">from {formatEGP(b.price)}</span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/build-a-box" className={btn("primary", "lg", "mt-8")}>Start building <ArrowRight className="h-5 w-5" /></Link>
        </Reveal>
        <BoxVisual slots={featured.slots} flavors={flavors} />
      </div>
    </section>
  );
}

export function WhyJordi({ store, hasBoxes }: { store: PublicSettings["store"]; hasBoxes: boolean }) {
  const points = [
    { icon: HandHeart, title: "Freshly made", text: "Baked with love in our home kitchen in Egypt." },
    hasBoxes && { icon: PackageOpen, title: "Your box, your rules", text: "Mix and match flavors in a box sized for the moment." },
    store.instapay_enabled && { icon: CreditCard, title: "Easy InstaPay", text: "Transfer in seconds. We check every payment personally." },
    (store.delivery_enabled || store.pickup_enabled) && {
      icon: store.delivery_enabled ? Bike : Store,
      title: store.delivery_enabled && store.pickup_enabled ? "Delivery or pickup" : store.delivery_enabled ? "Delivered to you" : "Easy pickup",
      text: store.delivery_enabled ? "We bring your order to your door, or you can collect it." : "Collect your order when it's ready.",
    },
    { icon: MapPinned, title: "Track every step", text: "A private link shows your order from oven to hand." },
  ].filter(Boolean).slice(0, 4) as { icon: typeof Star; title: string; text: string }[];

  return (
    <section className={`${wrap} grid gap-12 py-16 md:py-24 lg:grid-cols-[0.9fr_1.1fr]`} aria-labelledby="why-title">
      <Reveal className="relative">
        <span className="mb-5 block h-4 w-24 rounded-[50%] border-4 border-accent" aria-hidden="true" />
        <h2 id="why-title" className="font-display text-[clamp(1.9rem,4vw,3.2rem)] font-bold leading-[1.1] tracking-[-0.02em]">
          Why <span className="script-accent text-pink-ink">Jordi?</span>
        </h2>
        <p className="mt-4 max-w-sm text-lg text-cocoa-muted">A small bakery with a big sweet tooth, and ordering that just works.</p>
      </Reveal>
      <ul className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
        {points.map((p, i) => (
          <Reveal as="li" key={p.title} delay={i * 0.08} className="flex gap-4 border-t-2 border-pink-soft pt-6">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-pink-tint text-pink-ink"><p.icon className="h-6 w-6" /></span>
              <span>
                <span className="block font-display text-xl font-semibold">{p.title}</span>
                <span className="mt-1 block text-cocoa-muted">{p.text}</span>
              </span>
          </Reveal>
        ))}
      </ul>
    </section>
  );
}

export function FinalCta({ cta, products }: { cta: string; products: Product[] }) {
  return (
    <section className={`${wrap} pt-16 md:pt-24`}>
      <Reveal>
        <div className="relative overflow-hidden rounded-[40px] bg-pink-ink px-6 py-14 text-white md:px-16 md:py-20">
          <div className="relative z-10 max-w-xl">
            <h2 className="font-display text-[clamp(1.8rem,4vw,3rem)] font-bold leading-[1.1] tracking-[-0.02em]">Ready for a little bite of heaven?</h2>
            <p className="mt-4 text-lg text-white/90">Donuts, rolls, cookies or a whole tart: your next treat is a few taps away.</p>
            <Link href="/menu" className="mt-8 inline-flex h-14 items-center gap-2 rounded-full bg-white px-7 font-semibold text-pink-ink transition hover:bg-pink-tint active:scale-[0.96]">
              {cta} <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[42%] md:block" aria-hidden="true">
            {products.slice(0, 2).map((p, i) => (
              <DonutArt key={p.id} name={p.name} flavor={p.flavor} title="" className={`absolute aspect-square animate-float ${i === 0 ? "right-[10%] top-1/2 h-[74%] -translate-y-1/2" : "left-[2%] top-[8%] h-[32%] [animation-delay:-3s]"}`} />
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
