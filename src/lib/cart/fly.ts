"use client";
// Tiny event bus for the "donut flies into the cart" feedback animation.
export type Flight = { id: number; x: number; y: number; name: string; flavor: string | null; image: string | null };

const bus = typeof window === "undefined" ? null : new EventTarget();
let next = 0;

export function launchFlight(from: Element | null, donut: { name: string; flavor: string | null; image?: string | null }) {
  if (!bus || !from) return;
  const r = from.getBoundingClientRect();
  bus.dispatchEvent(new CustomEvent<Flight>("fly", { detail: { id: ++next, x: r.left + r.width / 2, y: r.top + r.height / 2, name: donut.name, flavor: donut.flavor, image: donut.image ?? null } }));
}

export function onFlight(handler: (f: Flight) => void) {
  if (!bus) return () => {};
  const listener = (e: Event) => handler((e as CustomEvent<Flight>).detail);
  bus.addEventListener("fly", listener);
  return () => bus.removeEventListener("fly", listener);
}
