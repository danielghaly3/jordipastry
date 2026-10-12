"use client";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { DonutArt } from "@/components/brand/donut-art";
import { ProductImageClient } from "@/components/store/product-image-client";
import { Quantity } from "@/components/store/quantity";
import { cart, type CartLine } from "@/lib/cart/store";
import { formatEGP } from "@/lib/format";

export function CartLines({ items, onNavigate }: { items: CartLine[]; onNavigate?: () => void }) {
  return (
    <ul className="divide-y divide-line">
      {items.map((l) => (
        <li key={l.key} className="flex gap-4 py-4">
          <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-[20px] bg-pink-tint">
            {l.type === "product" ? (
              <ProductImageClient name={l.name} flavor={l.flavor} url={l.image} className="h-full w-full" />
            ) : (
              <div className="grid grid-cols-2 gap-0.5 p-2">
                {l.contents.slice(0, 4).map((c) => <DonutArt key={c.productId} name={c.name} flavor={c.flavor} className="h-7 w-7" />)}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              {l.type === "product" ? (
                <Link href={`/menu/${l.slug}`} onClick={onNavigate} className="font-display text-lg font-semibold leading-tight hover:text-pink-ink">{l.name}</Link>
              ) : (
                <p className="font-display text-lg font-semibold leading-tight">{l.name}</p>
              )}
              <button type="button" onClick={() => cart.remove(l.key)} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-cocoa-muted hover:bg-bad-tint hover:text-bad" aria-label={`Remove ${l.name}`}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-0.5 text-sm text-cocoa-muted">
              {l.type === "product"
                ? [l.variant?.name, ...l.toppings.map((t) => t.name)].filter(Boolean).join(" · ")
                : l.contents.map((c) => `${c.quantity}× ${c.name}`).join(", ")}
            </p>
            <div className="mt-2 flex items-center justify-between gap-2">
              <Quantity size="sm" value={l.quantity} min={0} onChange={(q) => cart.setQuantity(l.key, q)} label={`Quantity of ${l.name}`} />
              <span className="font-display text-lg font-semibold">{formatEGP(l.unitPrice * l.quantity)}</span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
