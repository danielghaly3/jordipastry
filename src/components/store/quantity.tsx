"use client";
import { Minus, Plus } from "lucide-react";

export function Quantity({ value, onChange, min = 1, max = 20, size = "md", label = "Quantity" }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; size?: "sm" | "md"; label?: string;
}) {
  const h = size === "sm" ? "h-10" : "h-12";
  const w = size === "sm" ? "w-10" : "w-12";
  return (
    <div className={`inline-flex ${h} items-center rounded-full bg-white ring-1 ring-line`} role="group" aria-label={label}>
      <button type="button" className={`grid ${h} ${w} place-items-center rounded-full text-cocoa hover:bg-pink-tint disabled:opacity-40`} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label="Decrease">
        <Minus className="h-4 w-4" />
      </button>
      <span className="min-w-8 text-center font-display text-lg font-semibold tabular-nums" aria-live="polite">{value}</span>
      <button type="button" className={`grid ${h} ${w} place-items-center rounded-full text-cocoa hover:bg-pink-tint disabled:opacity-40`} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Increase">
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
