"use client";
import { useSyncExternalStore } from "react";

export type ProductLine = {
  key: string;
  type: "product";
  productId: string;
  slug: string;
  name: string;
  flavor: string | null;
  image: string | null;
  unitPrice: number;
  quantity: number;
  variant: { id: string; name: string; priceDelta: number } | null;
  toppings: { id: string; name: string; priceDelta: number }[];
};

export type BoxLine = {
  key: string;
  type: "box";
  boxSizeId: string;
  name: string;
  slots: number;
  unitPrice: number;
  quantity: number;
  contents: { productId: string; name: string; flavor: string | null; quantity: number; surcharge: number }[];
};

export type CartLine = ProductLine | BoxLine;

// Prices stored here are display estimates only. The server recomputes everything at checkout.
const STORAGE_KEY = "jordi-cart-v1";
const EMPTY: CartLine[] = [];
let lines: CartLine[] = EMPTY;
let loaded = false;
let open = false;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    lines = Array.isArray(parsed) ? parsed : EMPTY;
  } catch {
    lines = EMPTY;
  }
  window.addEventListener("storage", (e) => {
    if (e.key !== STORAGE_KEY) return;
    loaded = false;
    load();
    emit();
  });
}

function commit(next: CartLine[]) {
  lines = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Private mode / storage full: cart still works for this tab.
  }
  emit();
}

export const lineKey = (l: Omit<ProductLine, "key"> | Omit<BoxLine, "key">) =>
  l.type === "product"
    ? `p:${l.productId}:${l.variant?.id ?? ""}:${l.toppings.map((t) => t.id).sort().join(",")}`
    : `b:${l.boxSizeId}:${[...l.contents].sort((a, b) => a.productId.localeCompare(b.productId)).map((c) => `${c.productId}x${c.quantity}`).join(",")}`;

export const cart = {
  add(line: Omit<ProductLine, "key"> | Omit<BoxLine, "key">) {
    load();
    const key = lineKey(line);
    const existing = lines.find((l) => l.key === key);
    commit(
      existing
        ? lines.map((l) => (l.key === key ? { ...l, quantity: Math.min(20, l.quantity + line.quantity) } : l))
        : [...lines, { ...line, key } as CartLine],
    );
  },
  setQuantity(key: string, quantity: number) {
    commit(quantity <= 0 ? lines.filter((l) => l.key !== key) : lines.map((l) => (l.key === key ? { ...l, quantity: Math.min(20, quantity) } : l)));
  },
  remove(key: string) {
    commit(lines.filter((l) => l.key !== key));
  },
  clear() {
    commit(EMPTY);
  },
  setOpen(value: boolean) {
    open = value;
    emit();
  },
};

function subscribe(listener: () => void) {
  load();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useCart() {
  const items = useSyncExternalStore(subscribe, () => (load(), lines), () => EMPTY);
  const isOpen = useSyncExternalStore(subscribe, () => open, () => false);
  const count = items.reduce((n, l) => n + l.quantity, 0);
  const subtotal = items.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  return { items, count, subtotal, isOpen };
}

/** Payload for the server: ids and quantities only, never prices. */
export function toOrderItems(items: CartLine[]) {
  return items.map((l) =>
    l.type === "product"
      ? { type: "product" as const, product_id: l.productId, quantity: l.quantity, variant_id: l.variant?.id ?? null, topping_ids: l.toppings.map((t) => t.id) }
      : { type: "box" as const, box_size_id: l.boxSizeId, quantity: l.quantity, contents: l.contents.map((c) => ({ product_id: c.productId, quantity: c.quantity })) },
  );
}
