"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Minus, Plus, Shuffle, Trash2, X } from "lucide-react";
import { DonutArt } from "@/components/brand/donut-art";
import { SprinkleBurst } from "@/components/order/celebrate";
import { ProductImageClient } from "@/components/store/product-image-client";
import { btn } from "@/components/ui/button";
import { launchFlight } from "@/lib/cart/fly";
import { cart } from "@/lib/cart/store";
import { publicImageUrl } from "@/lib/env";
import { formatEGP } from "@/lib/format";
import { isAvailable, type BoxSize, type Product } from "@/lib/types";

const img = (p: Product) => (p.images[0] ? publicImageUrl("product-images", p.images[0].storage_path) : null);

export function BoxBuilder({ boxes, products, initialSize }: { boxes: BoxSize[]; products: Product[]; initialSize?: string }) {
  const [sizeId, setSizeId] = useState(boxes.find((b) => b.id === initialSize)?.id ?? boxes[Math.min(1, boxes.length - 1)].id);
  const [slots, setSlots] = useState<string[]>([]); // product id per filled slot, in order
  const [added, setAdded] = useState(false);
  const box = boxes.find((b) => b.id === sizeId)!;
  const flavors = useMemo(() => products.filter((p) => box.eligible.includes(p.id)), [products, box]);
  const byId = (id: string) => products.find((p) => p.id === id)!;

  const remaining = box.slots - slots.length;
  const surcharge = slots.reduce((s, id) => s + byId(id).box_surcharge, 0);
  const total = box.price + surcharge;
  const count = (id: string) => slots.filter((s) => s === id).length;

  const changeSize = (id: string) => {
    const next = boxes.find((b) => b.id === id)!;
    setSizeId(id);
    setSlots((s) => s.filter((pid) => next.eligible.includes(pid)).slice(0, next.slots));
  };
  const addOne = (id: string) => remaining > 0 && setSlots((s) => [...s, id]);
  const removeOne = (id: string) => setSlots((s) => { const i = s.lastIndexOf(id); return i < 0 ? s : [...s.slice(0, i), ...s.slice(i + 1)]; });
  const surprise = () => {
    const pool = flavors.filter(isAvailable);
    if (!pool.length) return;
    setSlots((s) => [...s, ...Array.from({ length: box.slots - s.length }, () => pool[Math.floor(Math.random() * pool.length)].id)]);
  };
  const addToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    const first = byId(slots[0]);
    launchFlight(e.currentTarget, { name: first.name, flavor: first.flavor, image: img(first) });
    const contents = [...new Set(slots)].map((id) => {
      const p = byId(id);
      return { productId: id, name: p.name, flavor: p.flavor, quantity: count(id), surcharge: p.box_surcharge };
    });
    cart.add({ type: "box", boxSizeId: box.id, name: box.name, slots: box.slots, unitPrice: total, quantity: 1, contents });
    setAdded(true);
    setSlots([]);
    setTimeout(() => setAdded(false), 2500);
  };

  const cols = box.slots <= 3 ? 3 : box.slots <= 8 ? 4 : box.slots <= 12 ? 4 : 6;

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_420px] lg:items-start">
      <div className="space-y-8">
        <fieldset>
          <legend className="mb-3 font-display text-xl font-semibold">1. Pick a box</legend>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {boxes.map((b) => (
              <label key={b.id} className={`relative cursor-pointer rounded-[24px] p-4 ring-2 transition ${b.id === sizeId ? "bg-pink-tint ring-pink-ink" : "bg-white ring-line hover:ring-pink-soft"}`}>
                <input type="radio" name="box-size" value={b.id} checked={b.id === sizeId} onChange={() => changeSize(b.id)} className="sr-only" />
                <span className="block font-display text-xl font-semibold">{b.name}</span>
                <span className="block text-sm text-cocoa-muted">{b.slots} donuts</span>
                <span className="mt-2 block font-display text-lg font-semibold text-accent-ink">{formatEGP(b.price)}</span>
                {b.id === sizeId && <span className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full bg-pink-ink text-white"><Check className="h-4 w-4" /></span>}
              </label>
            ))}
          </div>
          {box.description && <p className="mt-3 text-cocoa-muted">{box.description}</p>}
        </fieldset>

        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-xl font-semibold">2. Choose flavors</h2>
            <button type="button" onClick={surprise} disabled={remaining === 0} className={btn("ghost", "sm")}><Shuffle className="h-4 w-4" /> Surprise me</button>
          </div>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {flavors.map((p) => {
              const ok = isAvailable(p);
              const n = count(p.id);
              return (
                <li key={p.id} className={`relative rounded-[24px] bg-white p-3 shadow-cloud ring-2 transition ${n ? "ring-pink-ink" : "ring-transparent"} ${ok ? "" : "opacity-60"}`}>
                  <button type="button" onClick={() => addOne(p.id)} disabled={!ok || remaining === 0} className="block w-full text-left disabled:cursor-not-allowed" aria-label={`Add ${p.name} to box`}>
                    <ProductImageClient name={p.name} flavor={p.flavor} url={img(p)} className="aspect-square w-full overflow-hidden rounded-[18px] bg-pink-tint" />
                    <span className="mt-2 block font-display font-semibold leading-tight">{p.name}</span>
                    <span className="block text-sm text-cocoa-muted">{!ok ? "Sold out" : p.box_surcharge > 0 ? `Premium +${formatEGP(p.box_surcharge)}` : "Included"}</span>
                  </button>
                  {n > 0 && (
                    <div className="mt-2 flex items-center justify-between rounded-full bg-pink-tint p-1">
                      <button type="button" onClick={() => removeOne(p.id)} className="grid h-9 w-9 place-items-center rounded-full bg-white" aria-label={`Remove one ${p.name}`}><Minus className="h-4 w-4" /></button>
                      <span className="font-display text-lg font-semibold" aria-live="polite">{n}</span>
                      <button type="button" onClick={() => addOne(p.id)} disabled={remaining === 0} className="grid h-9 w-9 place-items-center rounded-full bg-white disabled:opacity-40" aria-label={`Add one more ${p.name}`}><Plus className="h-4 w-4" /></button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* The box */}
      <aside className="lg:sticky lg:top-28" aria-label="Your box">
        <div className="relative rounded-[32px] bg-white p-5 shadow-lift ring-[6px] ring-pink">
          {remaining === 0 && slots.length > 0 && <span key={slots.join()} className="absolute inset-0"><SprinkleBurst count={22} distance={220} /></span>}
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold">{box.name}</h2>
            {slots.length > 0 && <button type="button" onClick={() => setSlots([])} className={btn("ghost", "sm")}><Trash2 className="h-4 w-4" /> Clear</button>}
          </div>
          <p className="mt-1 text-cocoa-muted" aria-live="polite">
            {remaining === 0 ? "Your box is full!" : `${remaining} slot${remaining === 1 ? "" : "s"} left`}
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-pink-tint" aria-hidden="true">
            <motion.div className="h-full rounded-full bg-accent" animate={{ width: `${(slots.length / box.slots) * 100}%` }} />
          </div>
          <ul className="mt-5 grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {Array.from({ length: box.slots }, (_, i) => {
              const id = slots[i];
              const p = id ? byId(id) : null;
              return (
                <li key={i} className="aspect-square">
                  <AnimatePresence mode="popLayout">
                    {p ? (
                      <motion.button
                        key={`${i}-${id}`}
                        type="button"
                        onClick={() => setSlots((s) => [...s.slice(0, i), ...s.slice(i + 1)])}
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0 }}
                        transition={{ type: "spring", stiffness: 380, damping: 20 }}
                        className="group relative grid h-full w-full place-items-center rounded-full bg-pink-tint"
                        aria-label={`Remove ${p.name} from slot ${i + 1}`}
                      >
                        {img(p) ? <ProductImageClient name={p.name} flavor={p.flavor} url={img(p)} className="h-[88%] w-[88%] overflow-hidden rounded-full" /> : <DonutArt name={p.name} flavor={p.flavor} className="h-[88%] w-[88%]" title="" />}
                        <span className="absolute -right-0.5 -top-0.5 hidden h-5 w-5 place-items-center rounded-full bg-cocoa text-cream group-hover:grid"><X className="h-3 w-3" /></span>
                      </motion.button>
                    ) : (
                      <motion.span key={`empty-${i}`} className="block h-full w-full rounded-full border-2 border-dashed border-pink-soft" aria-hidden="true" />
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
          </ul>
          <dl className="mt-5 space-y-1 border-t border-line pt-4 text-[15px]">
            <div className="flex justify-between"><dt className="text-cocoa-muted">{box.name}</dt><dd>{formatEGP(box.price)}</dd></div>
            {surcharge > 0 && <div className="flex justify-between"><dt className="text-cocoa-muted">Premium flavors</dt><dd>+{formatEGP(surcharge)}</dd></div>}
            <div className="flex items-baseline justify-between pt-1"><dt className="font-semibold">Total</dt><dd className="font-display text-2xl font-bold">{formatEGP(total)}</dd></div>
          </dl>
          <button type="button" onClick={addToCart} disabled={remaining !== 0} className={btn("primary", "lg", "mt-4 w-full")}>
            {remaining === 0 ? "Add Box to Cart" : `Add ${remaining} more to finish`}
          </button>
          <AnimatePresence>
            {added && (
              <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 rounded-2xl bg-good-tint px-4 py-3 text-center text-sm font-semibold text-good" role="status">
                Box added! <button type="button" onClick={() => cart.setOpen(true)} className="underline">View cart</button> or <Link href="/checkout" className="underline">check out</Link>
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </aside>

      {/* Phone: sticky progress + action */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 p-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap gap-1" aria-hidden="true">
              {Array.from({ length: box.slots }, (_, i) => (
                <span key={i} className={`h-2.5 w-2.5 rounded-full transition ${i < slots.length ? "bg-pink-ink" : "bg-pink-soft"}`} />
              ))}
            </div>
            <p className="mt-1 text-sm text-cocoa-muted"><span className="font-display text-lg font-bold text-cocoa">{formatEGP(total)}</span> · {remaining === 0 ? "Box full" : `${slots.length}/${box.slots} chosen`}</p>
          </div>
          <button type="button" onClick={addToCart} disabled={remaining !== 0} className={btn("primary", "md")}>
            {remaining === 0 ? "Add Box to Cart" : `${remaining} left`}
          </button>
        </div>
      </div>
    </div>
  );
}
