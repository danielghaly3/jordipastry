import { Sparkle } from "lucide-react";
import { DonutArt } from "@/components/brand/donut-art";
import type { Product } from "@/lib/types";

/** The page's one marquee: real menu item names rolling by on a slightly tilted pink ribbon. */
export function FlavorMarquee({ products }: { products: Product[] }) {
  if (products.length < 3) return null;
  const items = products.slice(0, 12);
  const row = (copy: number) => (
    <ul className="flex shrink-0 items-center gap-8 pr-8" aria-hidden={copy > 0 || undefined}>
      {items.map((p) => (
        <li key={`${copy}-${p.id}`} className="flex shrink-0 items-center gap-3">
          <DonutArt name={p.name} flavor={p.flavor} title="" className="h-10 w-10 md:h-12 md:w-12" />
          <span className="font-display text-2xl font-bold text-white md:text-3xl">{p.name}</span>
          <Sparkle className="ml-5 h-5 w-5 fill-accent text-accent" aria-hidden="true" />
        </li>
      ))}
    </ul>
  );
  return (
    <section aria-label="Our menu" className="overflow-hidden py-6">
      <div className="-mx-4 -rotate-[1.5deg] bg-pink-ink py-4 shadow-cloud">
        <div className="flex w-max animate-marquee">
          {row(0)}
          {row(1)}
        </div>
      </div>
    </section>
  );
}
