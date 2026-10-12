"use client";
import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, ShoppingBag } from "lucide-react";
import { ProductImageClient } from "@/components/store/product-image-client";
import { Quantity } from "@/components/store/quantity";
import { Sprinkles } from "@/components/home/sprinkles";
import { donutLook } from "@/components/brand/donut-art";
import { launchFlight } from "@/lib/cart/fly";
import { cart } from "@/lib/cart/store";
import { publicImageUrl } from "@/lib/env";
import { formatEGP } from "@/lib/format";
import { effectivePrice, isAvailable, type Product } from "@/lib/types";

const img = (p: Product) => (p.images[0] ? publicImageUrl("product-images", p.images[0].storage_path) : null);

const STAR_IMAGES: Record<string, string> = {
  "glazed-donut": "/images/showcase/glazed-donut.webp",
  "dark-chocolate-donut": "/images/showcase/dark-chocolate-donut.webp",
  "lotus-donut": "/images/showcase/lotus-donut.webp",
  "classic-chocolate-roll": "/images/showcase/classic-chocolate-roll.webp",
  "classic-white-chocolate-roll": "/images/showcase/classic-white-chocolate-roll.webp",
  "chocolate-cookie": "/images/showcase/chocolate-cookie.webp",
  "cookie-tart": "/images/showcase/cookie-tart.webp",
  "large-cookie-tart": "/images/showcase/large-cookie-tart.webp",
  "white-chocolate-cookie": "/images/showcase/white-chocolate-cookie.webp",
};

// Owner-uploaded product photography always wins over the curated showcase cutouts.
const starImg = (p: Product) => img(p) ?? STAR_IMAGES[p.slug] ?? null;
const hasStarCutout = (p: Product) => !img(p) && Boolean(STAR_IMAGES[p.slug]);

function darkBackground(hex: string) {
  const [r, g, b] = [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16));
  return (r * 299 + g * 587 + b * 114) / 1000 < 145;
}

function Availability({ product, light = false }: { product: Product; light?: boolean }) {
  const ok = isAvailable(product);
  const low = ok && product.stock_quantity !== null && product.stock_quantity <= 5;
  const text = !ok ? "Sold out" : low ? `Only ${product.stock_quantity} left` : "Available today";
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${light ? "bg-white/20 text-white" : ok ? "bg-good-tint text-good" : "bg-bad-tint text-bad"}`}>
      {text}
    </span>
  );
}

function FeaturedCard({ product }: { product: Product }) {
  const variants = product.options.filter((o) => o.kind === "variant" && o.is_available);
  const [variantId, setVariantId] = useState<string | null>(variants[0]?.id ?? null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const variant = variants.find((v) => v.id === variantId) ?? null;
  const unit = effectivePrice(product) + (variant?.price_delta ?? 0);
  const available = isAvailable(product);
  const glaze = donutLook(`${product.flavor ?? ""} ${product.name}`).glaze;
  const dark = darkBackground(glaze);

  const add = (e: React.MouseEvent<HTMLButtonElement>) => {
    launchFlight(e.currentTarget, { name: product.name, flavor: product.flavor, image: img(product) });
    cart.add({
      type: "product", productId: product.id, slug: product.slug, name: product.name, flavor: product.flavor, image: img(product),
      unitPrice: unit, quantity: qty, variant: variant ? { id: variant.id, name: variant.name, priceDelta: variant.price_delta } : null, toppings: [],
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  return (
    <div className={`overflow-hidden rounded-[36px] shadow-lift ring-4 ring-white ${dark ? "text-white" : "text-cocoa"}`}>
      <div className="relative aspect-[5/4] overflow-hidden bg-white">
        <Sprinkles count={22} seed={product.name.length + 3} />
        <span className="absolute left-1/2 top-[9%] z-10 h-[7%] w-[34%] -translate-x-1/2 rounded-[50%] border-[5px] border-accent" aria-hidden="true" />
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={product.id}
            initial={{ opacity: 0, scale: 0.7, rotate: -40 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.7, rotate: 40 }}
            transition={{ type: "spring", stiffness: 180, damping: 20 }}
            className="absolute inset-[14%_18%_6%]"
          >
            <ProductImageClient name={product.name} flavor={product.flavor} url={starImg(product)} contain={hasStarCutout(product)} className={`h-full w-full ${img(product) ? "overflow-hidden rounded-full" : ""}`} />
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="space-y-4 p-6" style={{ backgroundColor: glaze }}>
        {/* Fixed-height header (2 name lines + Arabic line) so swiping between items doesn't make the card jump */}
        <div className="flex min-h-[5.25rem] items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="line-clamp-2 font-display text-[clamp(1.3rem,2.4vw,1.7rem)] font-bold leading-tight">{product.name}</h3>
            {product.name_ar && <p lang="ar" dir="rtl" className={`mt-1 truncate text-sm font-medium ${dark ? "text-white/80" : "text-cocoa-muted"}`}>{product.name_ar}</p>}
          </div>
          <span className="shrink-0 whitespace-nowrap font-display text-2xl font-bold">{formatEGP(unit)}</span>
        </div>
        {product.description && <p className={`line-clamp-2 text-[15px] ${dark ? "text-white/90" : "text-cocoa-muted"}`}>{product.description}</p>}
        <div className="flex flex-wrap items-center gap-2">
          <Availability product={product} light={dark} />
          {product.is_sample && <span className={`rounded-full px-3 py-1 text-xs font-bold ${dark ? "bg-white/20" : "bg-white/70"}`}>Sample item</span>}
        </div>
        {variants.length > 0 && (
          <fieldset className="flex flex-wrap gap-2">
            <legend className="sr-only">Choose an option</legend>
            {variants.map((v) => (
              <label key={v.id} className={`cursor-pointer rounded-full px-4 py-2 text-sm font-semibold ring-2 transition ${variantId === v.id ? "bg-white text-pink-ink ring-white" : dark ? "ring-white/40 hover:ring-white" : "ring-cocoa/25 hover:ring-cocoa/50"}`}>
                <input type="radio" name={`variant-${product.id}`} value={v.id} checked={variantId === v.id} onChange={() => setVariantId(v.id)} className="sr-only" />
                {v.name}{v.price_delta > 0 ? ` +${v.price_delta}` : ""}
              </label>
            ))}
          </fieldset>
        )}
        <div className="flex items-center gap-3 pt-1">
          <div className="[&>div]:bg-white [&>div]:text-cocoa"><Quantity size="sm" value={qty} onChange={setQty} /></div>
          <button
            type="button"
            disabled={!available}
            onClick={add}
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-white px-4 font-semibold text-pink-ink transition active:scale-[0.96] disabled:opacity-60"
          >
            {!available ? "Sold out" : added ? <><Check className="h-5 w-5" /> Added</> : <><ShoppingBag className="h-5 w-5" /> Add to cart</>}
          </button>
        </div>
        <Link href={`/menu/${product.slug}`} className="inline-block text-sm font-semibold underline underline-offset-4 hover:no-underline">
          See details{product.options.some((o) => o.kind === "topping") ? " and toppings" : ""}
        </Link>
      </div>
    </div>
  );
}

function MiniCard({ product, onSelect }: { product: Product; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="group flex h-full w-full flex-col items-center rounded-[28px] bg-white p-5 text-center shadow-cloud"
      aria-label={`Feature ${product.name}`}
    >
      <ProductImageClient name={product.name} flavor={product.flavor} url={starImg(product)} contain={hasStarCutout(product)} className={`aspect-square w-[78%] transition-transform duration-500 group-hover:rotate-12 ${img(product) ? "overflow-hidden rounded-full" : ""}`} />
      <span className="mt-3 font-display text-lg font-semibold leading-tight">{product.name}</span>
      {product.name_ar && <span lang="ar" dir="rtl" className="mt-1 text-sm font-medium text-cocoa-muted">{product.name_ar}</span>}
      <span className="mt-1 font-display text-base font-semibold text-accent-ink">{formatEGP(effectivePrice(product))}</span>
      <span className="mt-2"><Availability product={product} /></span>
    </button>
  );
}

function Arrow({ dir, onClick }: { dir: 1 | -1; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-cocoa shadow-cloud ring-1 ring-line transition hover:bg-pink-tint active:scale-95" aria-label={dir === 1 ? "Next treat" : "Previous treat"}>
      {dir === 1 ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
    </button>
  );
}

export function Showcase({ products }: { products: Product[] }) {
  const [active, setActive] = useState(0);
  const n = products.length;
  if (n === 0) return null;
  const go = (d: number) => setActive((a) => (a + d + n) % n);
  const offsets = n >= 3 ? [-1, 0, 1] : n === 2 ? [0, 1] : [0];
  const visible = offsets.map((o) => ({ product: products[(active + o + n) % n], index: (active + o + n) % n }));
  const current = products[active];

  return (
    <div aria-roledescription="carousel" aria-label="Featured treats">
      {/* Desktop: featured card among its neighbours */}
      <div className="hidden items-center gap-5 lg:flex">
        {/* Arrows are pinned to the photo's middle (5:4 photo on a 360px / 380px card), so they never move */}
        {n > 1 && <div className="self-start lg:mt-[120px] xl:mt-[128px]"><Arrow dir={-1} onClick={() => go(-1)} /></div>}
        <div className="flex flex-1 items-start justify-center gap-5">
          {visible.map(({ product, index }) => (
            <motion.div
              layout
              key={product.id}
              transition={{ type: "spring", stiffness: 200, damping: 26 }}
              className={`shrink-0 ${product.id === current.id ? "w-[360px] xl:w-[380px]" : "w-[200px] xl:w-[220px]"}`}
            >
              {product.id === current.id ? <FeaturedCard product={product} /> : <MiniCard product={product} onSelect={() => setActive(index)} />}
            </motion.div>
          ))}
        </div>
        {n > 1 && <div className="self-start lg:mt-[120px] xl:mt-[128px]"><Arrow dir={1} onClick={() => go(1)} /></div>}
      </div>

      {/* Mobile/tablet: one card + thumbnail strip */}
      <div className="lg:hidden">
        <div className="relative mx-auto max-w-[440px]">
          <FeaturedCard key={current.id} product={current} />
          {/* Arrows sit on the photo (always 5:4), so the card's changing height can't move them */}
          {n > 1 && (
            <div className="pointer-events-none absolute inset-x-0 top-0 flex aspect-[5/4] items-center justify-between px-2">
              <span className="pointer-events-auto"><Arrow dir={-1} onClick={() => go(-1)} /></span>
              <span className="pointer-events-auto"><Arrow dir={1} onClick={() => go(1)} /></span>
            </div>
          )}
        </div>
        {n > 1 && (
          <div className="mt-5">
            <ul className="no-scrollbar flex flex-1 snap-x gap-3 overflow-x-auto py-2">
              {products.map((p, i) => (
                <li key={p.id} className="snap-center">
                  <button
                    type="button"
                    onClick={() => setActive(i)}
                    aria-label={`Feature ${p.name}`}
                    aria-current={i === active}
                    className={`grid h-16 w-16 place-items-center rounded-full bg-white shadow-cloud transition ${i === active ? "ring-[3px] ring-accent" : "ring-1 ring-line"}`}
                  >
                    <ProductImageClient name={p.name} flavor={p.flavor} url={starImg(p)} contain={hasStarCutout(p)} className={`h-14 w-14 ${img(p) ? "overflow-hidden rounded-full" : ""}`} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <p className="sr-only" aria-live="polite">Now featuring {current.name}</p>
    </div>
  );
}
