import type { Metadata } from "next";
import { CartPage } from "@/components/checkout/cart-page";
import { CheckoutSteps } from "@/components/checkout/steps";

export const metadata: Metadata = { title: "Your Cart", robots: { index: false } };

export default function Page() {
  return (
    <div className="mx-auto max-w-[860px] px-5 pb-16 pt-8 md:px-8 md:pt-12">
      <CheckoutSteps current={0} />
      <h1 className="mt-6 font-display text-[clamp(1.8rem,4vw,2.8rem)] font-bold leading-[1.1]">Your cart</h1>
      <CartPage />
    </div>
  );
}
