"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Horizontal rail that drifts on its own in a seamless loop (items are rendered twice; the copy is inert).
 * Pauses only in a hidden tab or for reduced motion; it otherwise wraps continuously.
 */
export function AutoRail({ items, label, speed = 32, itemClassName = "w-[260px] md:w-[280px]", className = "mt-8 pb-6 pt-2" }: {
  items: React.ReactNode[]; label: string; speed?: number; itemClassName?: string; className?: string;
}) {
  const ref = useRef<HTMLUListElement>(null);
  const setWidth = useRef(0); // width of one full set of cards (incl. gaps): the loop wraps at this distance
  const [copies, setCopies] = useState(1);

  useEffect(() => {
    const el = ref.current;
    if (!el || items.length < 3) return;
    // Measure the ORIGINAL set only, then add enough copies to always have a full screen ahead.
    const measure = () => {
      const kids = el.children as HTMLCollectionOf<HTMLElement>;
      const first = kids[0];
      const next = kids[items.length]; // first card of the next set, if rendered
      const last = kids[items.length - 1];
      setWidth.current = next ? next.offsetLeft - first.offsetLeft : last.offsetLeft + last.offsetWidth + 20 - first.offsetLeft;
      const need = Math.max(2, Math.ceil(el.clientWidth / setWidth.current) + 1);
      setCopies((c) => (c === need ? c : need));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [items.length]);

  const loop = copies > 1;
  useEffect(() => {
    const el = ref.current;
    if (!el || !loop || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let last = performance.now();
    let carry = 0; // sub-pixel progress (scrollLeft only stores whole pixels in some browsers)
    const tick = (now: number) => {
      const dt = Math.min(64, now - last);
      last = now;
      if (document.visibilityState === "visible") {
        carry += (speed * dt) / 1000;
        const step = Math.floor(carry);
        if (step) {
          carry -= step;
          el.scrollLeft += step;
        }
        if (setWidth.current && el.scrollLeft >= setWidth.current) el.scrollLeft -= setWidth.current;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [loop, speed]);

  return (
    <div className="relative">
      <ul
        ref={ref}
        aria-label={label}
        tabIndex={0} // lets keyboard users scroll the rail even when its cards have no links
        className={`no-scrollbar flex gap-5 overflow-x-auto px-5 md:px-[max(2rem,calc((100vw_-_1240px)/2_+_2rem))] ${className}`}
      >
        {items.map((item, i) => <li key={i} className={`shrink-0 ${itemClassName}`}>{item}</li>)}
        {Array.from({ length: copies - 1 }, (_, c) =>
          items.map((item, i) => <li key={`copy-${c}-${i}`} className={`shrink-0 ${itemClassName}`} aria-hidden="true" inert>{item}</li>),
        )}
      </ul>
    </div>
  );
}
