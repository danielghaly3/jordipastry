"use client";
import { motion } from "motion/react";
import { DonutArt } from "@/components/brand/donut-art";

/** Open donut box filled with flavors; slots pop in when scrolled into view. */
export function BoxVisual({ slots, flavors }: { slots: number; flavors: { name: string; flavor: string | null }[] }) {
  const cols = slots <= 3 ? 3 : slots <= 6 ? 3 : 4;
  const list = flavors.length ? flavors : [{ name: "Glazed", flavor: "vanilla" }];
  return (
    <div className="relative mx-auto w-full max-w-[460px]">
      <div className="absolute -top-6 left-6 right-6 h-16 origin-bottom -skew-x-6 rounded-t-[28px] bg-pink-soft" aria-hidden="true" />
      <div className="relative rounded-[32px] bg-white p-5 shadow-lift ring-[6px] ring-pink">
        <ul className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {Array.from({ length: slots }, (_, i) => {
            const f = list[i % list.length];
            return (
              <motion.li
                key={i}
                initial={{ scale: 0, rotate: -60 }}
                whileInView={{ scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 260, damping: 18, delay: i * 0.07 }}
                className="grid aspect-square place-items-center rounded-full bg-pink-tint"
              >
                <DonutArt name={f.name} flavor={f.flavor} className="h-[86%] w-[86%]" title="" />
              </motion.li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
