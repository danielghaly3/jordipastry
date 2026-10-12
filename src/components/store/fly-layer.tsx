"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { DonutArt } from "@/components/brand/donut-art";
import { onFlight, type Flight } from "@/lib/cart/fly";

type Live = Flight & { tx: number; ty: number };

/** Feedback: a little donut arcs from the Add button into the cart icon. */
export function FlyLayer() {
  const reduce = useReducedMotion();
  const [flights, setFlights] = useState<Live[]>([]);

  useEffect(() => onFlight((f) => {
    if (reduce) return;
    const target = [...document.querySelectorAll<HTMLElement>("[data-cart-target]")].find((el) => el.offsetParent !== null);
    if (!target) return;
    const r = target.getBoundingClientRect();
    setFlights((list) => [...list, { ...f, tx: r.left + r.width / 2, ty: r.top + r.height / 2 }]);
  }), [reduce]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[70]" aria-hidden="true">
      <AnimatePresence>
        {flights.map((f) => (
          <motion.div
            key={f.id}
            className="absolute left-0 top-0 h-14 w-14"
            initial={{ x: f.x - 28, y: f.y - 28, scale: 1, rotate: 0, opacity: 1 }}
            animate={{ x: [f.x - 28, (f.x + f.tx) / 2 - 28, f.tx - 28], y: [f.y - 28, Math.min(f.y, f.ty) - 120, f.ty - 28], scale: [1, 1.15, 0.35], rotate: [0, 200, 360] }}
            transition={{ duration: 0.75, ease: [0.45, 0, 0.2, 1] }}
            onAnimationComplete={() => setFlights((list) => list.filter((x) => x.id !== f.id))}
          >
            {f.image ? (
              <span className="relative block h-full w-full overflow-hidden rounded-full shadow-lift"><Image src={f.image} alt="" fill sizes="56px" className="object-cover" /></span>
            ) : (
              <DonutArt name={f.name} flavor={f.flavor} title="" className="h-full w-full drop-shadow-[0_8px_10px_rgba(75,41,37,0.3)]" />
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
