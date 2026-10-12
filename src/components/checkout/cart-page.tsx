"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Mascot } from "@/components/brand/mascot";
import { CartLines } from "@/components/store/cart-lines";
import { btn } from "@/components/ui/button";
import { useCart } from "@/lib/cart/store";
import { formatEGP } from "@/lib/format";

export function CartPage() {
  const { items, subtotal } = useCart();
  if (items.length === 0) {
    return (
      <div className="mt-8 rounded-[28px] bg-white p-10 text-center shadow-cloud">
        <Mascot pose="empty-box" className="mx-auto h-40 w-40 md:h-[200px] md:w-[200px]" />
        <p className="font-display text-2xl font-semibold">Your cart is empty</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/menu" className={btn("primary", "md")}>Browse the menu</Link>
          <Link href="/build-a-box" className={btn("secondary", "md")}>Build a box</Link>
        </div>
      </div>
    );
  }
  return (
    <div className="mt-8 rounded-[28px] bg-white p-5 shadow-cloud md:p-8">
      <CartLines items={items} />
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
        <div>
          <p className="text-cocoa-muted">Subtotal</p>
          <p className="font-display text-3xl font-bold">{formatEGP(subtotal)}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/menu" className={btn("secondary", "lg")}>Keep shopping</Link>
          <Link href="/checkout" className={btn("primary", "lg")}>Checkout <ArrowRight className="h-5 w-5" /></Link>
        </div>
      </div>
    </div>
  );
}
