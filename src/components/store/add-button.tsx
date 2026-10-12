"use client";
import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Plus } from "lucide-react";
import { btn } from "@/components/ui/button";
import { launchFlight } from "@/lib/cart/fly";
import { cart } from "@/lib/cart/store";
import { publicImageUrl } from "@/lib/env";
import { effectivePrice, isAvailable, type Product } from "@/lib/types";

/** Quick add from a card. Products that need a choice (variants) send the customer to the detail page. */
export function QuickAddButton({ product, size = "sm", label = "Add", className = "" }: { product: Product; size?: "sm" | "md" | "lg"; label?: string; className?: string }) {
  const [added, setAdded] = useState(false);
  const needsChoice = product.options.some((o) => o.kind === "variant" && o.is_available);

  if (!isAvailable(product)) {
    return <span className={btn("secondary", size, `pointer-events-none opacity-70 ${className}`)} aria-disabled="true">Sold out</span>;
  }
  if (needsChoice) {
    return <Link href={`/menu/${product.slug}`} className={btn("secondary", size, className)} aria-label={`Choose options for ${product.name}`}>Choose</Link>;
  }
  return (
    <button
      type="button"
      className={btn("primary", size, `min-w-[96px] ${className}`)}
      aria-label={`Add ${product.name} to cart`}
      onClick={(e) => {
        launchFlight(e.currentTarget, { name: product.name, flavor: product.flavor, image: product.images[0] ? publicImageUrl("product-images", product.images[0].storage_path) : null });
        cart.add({
          type: "product", productId: product.id, slug: product.slug, name: product.name, flavor: product.flavor,
          image: product.images[0] ? publicImageUrl("product-images", product.images[0].storage_path) : null,
          unitPrice: effectivePrice(product), quantity: 1, variant: null, toppings: [],
        });
        setAdded(true);
        setTimeout(() => setAdded(false), 1200);
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={added ? "y" : "n"} initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }} transition={{ duration: 0.15 }} className="inline-flex items-center gap-1.5">
          {added ? <><Check className="h-4 w-4" /> Added</> : <><Plus className="h-4 w-4" /> {label}</>}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
