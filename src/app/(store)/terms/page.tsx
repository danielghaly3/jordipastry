import type { Metadata } from "next";
import { Legal } from "@/components/store/legal";
import { getPublicSettings } from "@/lib/data";

export const metadata: Metadata = { title: "Terms" };

export default async function TermsPage() {
  const { branding } = await getPublicSettings();
  return (
    <Legal title="Terms of Ordering" updated="2026-10-11">
      <p>These terms apply to orders placed with {branding.store_name} through this website.</p>
      <h2>Orders and prices</h2>
      <p>All prices are in Egyptian Pounds (EGP). The total shown at checkout, including any delivery fee, is the amount due. Items are made fresh and availability can change during the day.</p>
      <h2>Payment</h2>
      <p>For InstaPay orders, your order is confirmed only after we verify the transfer in our InstaPay account. Telling us you have paid does not confirm the order on its own. If we can&apos;t find your payment, we&apos;ll contact you. For cash orders, please have the exact amount ready.</p>
      <h2>Delivery and pickup</h2>
      <p>Delivery times are estimates. Please make sure your phone number and address are correct so we can reach you. For pickup, we&apos;ll share the details once your order is ready.</p>
      <h2>Changes and cancellations</h2>
      <p>To change or cancel an order, message us as soon as possible. Once preparation has started we may not be able to cancel. If we cancel an order you already paid for, we will refund the transfer.</p>
      <h2>Allergies</h2>
      <p>Our kitchen handles common allergens. If you have an allergy, please tell us in your order notes or message us before ordering.</p>
    </Legal>
  );
}
