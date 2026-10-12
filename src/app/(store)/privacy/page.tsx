import type { Metadata } from "next";
import { Legal } from "@/components/store/legal";
import { getPublicSettings } from "@/lib/data";

export const metadata: Metadata = { title: "Privacy Policy" };

// Describes what this app actually collects and does. The owner should have it reviewed (see docs/OWNER_GUIDE.md).
export default async function PrivacyPage() {
  const { branding, contact } = await getPublicSettings();
  return (
    <Legal title="Privacy Policy" updated="2026-10-11">
      <p>{branding.store_name} (&quot;we&quot;) runs this website to take donut and pastry orders. This page explains what we collect and why.</p>
      <h2>What we collect</h2>
      <ul>
        <li>Your name, mobile number and (if different) WhatsApp number.</li>
        <li>Your delivery area and address if you choose delivery.</li>
        <li>Your order, notes, requested time and payment status.</li>
        <li>If you choose to, an InstaPay transaction reference and a receipt screenshot.</li>
        <li>A one-way hashed version of your IP address, used only to stop abuse (we do not store the address itself).</li>
      </ul>
      <p>You don&apos;t need an account to order. We don&apos;t use advertising trackers. Your cart is saved only in your own browser.</p>
      <h2>Why we use it</h2>
      <ul>
        <li>To prepare, deliver or hand over your order.</li>
        <li>To check your payment and contact you about your order, including on WhatsApp.</li>
        <li>To keep sales records and prevent fraud.</li>
      </ul>
      <h2>Who can see it</h2>
      <p>Only the shop owner. Your data is stored with our hosting providers (Supabase for the database and files, Vercel for the website). New-order alerts with your order details are sent to the owner&apos;s private Telegram chat. Payment receipts are stored privately and are never public.</p>
      <h2>How long we keep it</h2>
      <p>We keep order records for as long as we need them for accounting and legal reasons, and delete them when no longer needed.</p>
      <h2>Your choices</h2>
      <p>You can ask us to see, correct or delete your personal data, in line with Egypt&apos;s Personal Data Protection Law (Law No. 151 of 2020).{contact.whatsapp || contact.email ? " Contact us using the details on our Contact page." : ""}</p>
    </Legal>
  );
}
