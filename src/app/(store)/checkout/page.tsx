import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { CheckoutSteps } from "@/components/checkout/steps";
import { getDeliveryAreas, getPublicSettings } from "@/lib/data";
import { availableSlots } from "@/lib/schedule";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  const [{ store }, areas] = await Promise.all([getPublicSettings(), getDeliveryAreas()]);
  return (
    <div className="mx-auto max-w-[1240px] px-5 pb-32 pt-8 md:px-8 md:pt-12">
      <CheckoutSteps current={1} />
      <h1 className="mt-6 font-display text-[clamp(1.8rem,4vw,2.8rem)] font-bold leading-[1.1]">Checkout</h1>
      <p className="mt-2 text-cocoa-muted">No account needed. It takes about a minute.</p>
      <CheckoutForm
        store={store}
        areas={areas}
        slots={store.scheduling_enabled ? availableSlots(store) : []}
      />
    </div>
  );
}
