"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, X } from "lucide-react";
import { Mascot } from "@/components/brand/mascot";
import { CartLines } from "@/components/store/cart-lines";
import { btn } from "@/components/ui/button";
import { cart, useCart } from "@/lib/cart/store";
import { formatEGP } from "@/lib/format";

export function CartDrawer() {
  const { items, subtotal, count, isOpen } = useCart();
  const panel = useRef<HTMLDivElement>(null);
  const close = () => cart.setOpen(false);

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "Tab" && panel.current) {
        const focusable = panel.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), input");
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50">
          <motion.div className="absolute inset-0 bg-cocoa/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label="Your cart"
            tabIndex={-1}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="absolute inset-y-0 right-0 flex w-full max-w-[440px] flex-col bg-cream shadow-lift outline-none sm:rounded-l-[36px]"
          >
            <div className="flex items-center justify-between px-6 pb-2 pt-6">
              <h2 className="font-display text-3xl font-bold">Your cart</h2>
              <button type="button" onClick={close} className="grid h-11 w-11 place-items-center rounded-full bg-white ring-1 ring-line hover:bg-pink-tint" aria-label="Close cart">
                <X className="h-5 w-5" />
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
                <Mascot pose="empty-box" className="h-40 w-40 md:h-[200px] md:w-[200px]" />
                <p className="font-display text-2xl font-semibold">Your cart is feeling light</p>
                <p className="text-cocoa-muted">Pick a few treats and they will wait for you here.</p>
                <Link href="/menu" onClick={close} className={btn("primary", "md")}>Browse the menu</Link>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-6">
                  <CartLines items={items} onNavigate={close} />
                </div>
                <div className="space-y-3 border-t border-line bg-white px-6 pb-6 pt-4 sm:rounded-bl-[36px]">
                  <div className="flex items-baseline justify-between">
                    <span className="text-cocoa-muted">Subtotal ({count} item{count === 1 ? "" : "s"})</span>
                    <span className="font-display text-2xl font-bold">{formatEGP(subtotal)}</span>
                  </div>
                  <p className="text-xs text-cocoa-muted">Delivery fee and final prices are confirmed at checkout.</p>
                  <Link href="/checkout" onClick={close} className={btn("primary", "lg", "w-full")}>
                    Checkout <ArrowRight className="h-5 w-5" />
                  </Link>
                  <button type="button" onClick={close} className={btn("ghost", "md", "w-full")}>Continue shopping</button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
