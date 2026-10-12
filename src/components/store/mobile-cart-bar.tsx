"use client";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ShoppingBag } from "lucide-react";
import { cart, useCart } from "@/lib/cart/store";
import { formatEGP } from "@/lib/format";

/** True when the phone cart bar is on screen (other floating buttons sit above it). */
export function useCartBarShown() {
  const { count, isOpen } = useCart();
  const path = usePathname();
  return !(isOpen || count === 0 || path.startsWith("/checkout") || path.startsWith("/cart") || path.startsWith("/order") || path.startsWith("/build-a-box"));
}

/** Floating order button on phones, once there is something in the cart. */
export function MobileCartBar() {
  const { count, subtotal } = useCart();
  const hidden = !useCartBarShown();
  return (
    <AnimatePresence>
      {!hidden && (
        <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="fixed inset-x-0 bottom-0 z-30 p-3 pb-[max(12px,env(safe-area-inset-bottom))] md:hidden">
          <button type="button" onClick={() => cart.setOpen(true)} className="flex h-16 w-full items-center justify-between rounded-full bg-pink-ink pl-3 pr-6 text-white shadow-lift active:scale-[0.98]">
            <span className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-white/20"><ShoppingBag className="h-5 w-5" /></span>
              <span className="font-semibold">View cart · {count} item{count === 1 ? "" : "s"}</span>
            </span>
            <span className="font-display text-lg font-bold">{formatEGP(subtotal)}</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
