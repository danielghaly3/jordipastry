"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, PackageOpen, Plus } from "lucide-react";
import { launchFlight } from "@/lib/cart/fly";
import { cart } from "@/lib/cart/store";
import { publicImageUrl } from "@/lib/env";
import { formatEGP } from "@/lib/format";
import type { BoxSize, Product } from "@/lib/types";

export function ProductBoxOptions({ product, boxes }: { product: Product; boxes: BoxSize[] }) {
  const [added, setAdded] = useState<string | null>(null);

  const addBox = (box: BoxSize, target: HTMLButtonElement) => {
    const image = product.images[0] ? publicImageUrl("product-images", product.images[0].storage_path) : null;
    launchFlight(target, { name: product.name, flavor: product.flavor, image });
    cart.add({
      type: "box",
      boxSizeId: box.id,
      name: `Box of ${box.slots} · ${product.name}`,
      slots: box.slots,
      unitPrice: box.price + product.box_surcharge * box.slots,
      quantity: 1,
      contents: [{
        productId: product.id,
        name: product.name,
        flavor: product.flavor,
        quantity: box.slots,
        surcharge: product.box_surcharge,
      }],
    });
    setAdded(box.id);
    setTimeout(() => setAdded((current) => current === box.id ? null : current), 1500);
  };

  return (
    <section className="mt-8 border-t border-line pt-7" aria-labelledby="box-options-title">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-pink-tint text-pink-ink"><PackageOpen className="h-5 w-5" /></span>
        <div>
          <h2 id="box-options-title" className="font-display text-2xl font-semibold">Buy a full box</h2>
          <p className="text-sm text-cocoa-muted">Every donut in the box will be {product.name}.</p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {boxes.map((box) => {
          const total = box.price + product.box_surcharge * box.slots;
          const isAdded = added === box.id;
          return (
            <button
              key={box.id}
              type="button"
              onClick={(event) => addBox(box, event.currentTarget)}
              className="group flex min-h-24 items-center justify-between gap-3 rounded-[22px] bg-white p-4 text-left shadow-cloud ring-1 ring-line transition hover:-translate-y-0.5 hover:ring-pink-soft hover:shadow-lift active:scale-[0.98]"
              aria-label={`Add a box of ${box.slots} ${product.name} donuts to cart`}
            >
              <span>
                <span className="block font-display text-xl font-semibold">Box of {box.slots}</span>
                <span className="mt-1 block text-sm font-semibold text-accent-ink">{formatEGP(total)}</span>
              </span>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span key={isAdded ? "added" : "add"} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-pink-tint text-pink-ink">
                  {isAdded ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                </motion.span>
              </AnimatePresence>
            </button>
          );
        })}
      </div>
    </section>
  );
}
