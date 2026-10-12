"use client";
import { motion } from "motion/react";

const COLORS = ["#ff861c", "#7ec8e3", "#f7d154", "#b6e3a1", "#f7b4d4", "#c7b5f5"];

/** One-time burst after the order is placed. */
export function Celebrate() {
  return (
    <div className="pointer-events-none relative mx-auto h-28 w-28" aria-hidden="true">
      <motion.span initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 14 }} className="absolute inset-0 grid place-items-center rounded-full bg-good text-white">
        <svg viewBox="0 0 24 24" className="h-12 w-12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.25, duration: 0.4 }} /></svg>
      </motion.span>
      <SprinkleBurst />
    </div>
  );
}

/** Sprinkles shooting out from the center of the nearest positioned parent (feedback moments only). */
export function SprinkleBurst({ count = 14, distance = 90 }: { count?: number; distance?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2;
        return (
          <motion.span
            key={i}
            className="pointer-events-none absolute left-1/2 top-1/2 h-1.5 w-4 rounded-full"
            style={{ backgroundColor: COLORS[i % COLORS.length], rotate: `${(a * 180) / Math.PI}deg` }}
            initial={{ x: 0, y: 0, opacity: 1 }}
            animate={{ x: Math.cos(a) * distance, y: Math.sin(a) * distance, opacity: 0 }}
            transition={{ duration: 0.9, ease: "easeOut", delay: 0.2 }}
            aria-hidden="true"
          />
        );
      })}
    </>
  );
}
