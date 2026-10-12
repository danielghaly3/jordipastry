"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, ShoppingBag } from "lucide-react";
import { Quantity } from "@/components/store/quantity";
import { btn } from "@/components/ui/button";
import { launchFlight } from "@/lib/cart/fly";
import { cart } from "@/lib/cart/store";
import { publicImageUrl } from "@/lib/env";
import { formatEGP } from "@/lib/format";
import { effectivePrice, isAvailable, type Product } from "@/lib/types";

export function Purchase({ product }: { product: Product }) {
  const variants = product.options.filter((o) => o.kind === "variant" && o.is_available);
  const toppings = product.options.filter((o) => o.kind === "topping" && o.is_available);
  const [variantId, setVariantId] = useState(variants[0]?.id ?? "");
  const [picked, setPicked] = useState<string[]>([]);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const variant = variants.find((v) => v.id === variantId) ?? null;
  const chosen = toppings.filter((t) => picked.includes(t.id));
  const unit = effectivePrice(product) + (variant?.price_delta ?? 0) + chosen.reduce((s, t) => s + t.price_delta, 0);
  const available = isAvailable(product);
  const maxQty = Math.min(20, product.stock_quantity ?? 20);

  const add = (e: React.MouseEvent<HTMLButtonElement>) => {
    launchFlight(e.currentTarget, { name: product.name, flavor: product.flavor, image: product.images[0] ? publicImageUrl("product-images", product.images[0].storage_path) : null });
    cart.add({
      type: "product", productId: product.id, slug: product.slug, name: product.name, flavor: product.flavor,
      image: product.images[0] ? publicImageUrl("product-images", product.images[0].storage_path) : null,
      unitPrice: unit, quantity: qty,
      variant: variant ? { id: variant.id, name: variant.name, priceDelta: variant.price_delta } : null,
      toppings: chosen.map((t) => ({ id: t.id, name: t.name, priceDelta: t.price_delta })),
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const pill = (on: boolean) => `flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-full px-5 py-2 ring-2 transition ${on ? "bg-pink-tint ring-pink-ink" : "bg-white ring-line hover:ring-pink-soft"}`;

  return (
    <div className="space-y-6">
      {variants.length > 0 && (
        <fieldset>
          <legend className="mb-3 font-display text-lg font-semibold">Choose one</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {variants.map((v) => (
              <label key={v.id} className={pill(variantId === v.id)}>
                <span className="flex items-center gap-3">
                  <input type="radio" name="variant" value={v.id} checked={variantId === v.id} onChange={() => setVariantId(v.id)} className="h-5 w-5 accent-[var(--pink-ink)]" />
                  <span className="font-semibold">{v.name}</span>
                </span>
                {v.price_delta > 0 && <span className="text-sm text-cocoa-muted">+{formatEGP(v.price_delta)}</span>}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {toppings.length > 0 && (
        <fieldset>
          <legend className="mb-3 font-display text-lg font-semibold">Extra toppings <span className="text-sm font-normal text-cocoa-muted">(optional)</span></legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {toppings.map((t) => (
              <label key={t.id} className={pill(picked.includes(t.id))}>
                <span className="flex items-center gap-3">
                  <input type="checkbox" checked={picked.includes(t.id)} onChange={(e) => setPicked((p) => (e.target.checked ? [...p, t.id] : p.filter((x) => x !== t.id)))} className="h-5 w-5 accent-[var(--pink-ink)]" />
                  <span className="font-semibold">{t.name}</span>
                </span>
                {t.price_delta > 0 && <span className="text-sm text-cocoa-muted">+{formatEGP(t.price_delta)}</span>}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Quantity value={qty} onChange={setQty} max={Math.max(1, maxQty)} />
        <button type="button" onClick={add} disabled={!available} className={btn("primary", "lg", "flex-1 min-w-[220px]")}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={added ? "a" : "b"} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }} transition={{ duration: 0.15 }} className="inline-flex items-center gap-2">
              {!available ? "Sold out" : added ? <><Check className="h-5 w-5" /> Added to cart</> : <><ShoppingBag className="h-5 w-5" /> Add to cart · {formatEGP(unit * qty)}</>}
            </motion.span>
          </AnimatePresence>
        </button>
      </div>
    </div>
  );
}
