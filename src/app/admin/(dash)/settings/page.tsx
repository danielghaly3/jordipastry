import type { Metadata } from "next";
import Link from "next/link";
import { Bell, ChevronRight } from "lucide-react";
import { DeliverySettings, GeneralSettings, InventorySettings, PaymentSettings } from "@/components/admin/settings-forms";
import { PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { getPrivateSetting, getPublicSettings } from "@/lib/data";
import { telegramConfigured } from "@/lib/telegram";

export const metadata: Metadata = { title: "Store Settings" };

export default async function SettingsPage() {
  const { supabase } = await requireAdmin();
  const [{ store, branding }, instapay, pickup, { data: areas }] = await Promise.all([
    getPublicSettings(), getPrivateSetting("instapay"), getPrivateSetting("pickup"),
    supabase.from("delivery_areas").select("id,name,fee,is_active,sort_order").order("sort_order").order("name"),
  ]);
  return (
    <>
      <PageHeader title="Store Settings" />
      <nav aria-label="Settings sections" className="no-scrollbar -mx-4 mb-5 flex gap-2 overflow-x-auto px-4">
        {[["general", "General"], ["payment", "Payment"], ["delivery", "Delivery"], ["inventory", "Inventory"]].map(([id, l]) => (
          <a key={id} href={`#${id}`} className="grid h-10 shrink-0 place-items-center rounded-full bg-white px-4 text-sm font-bold ring-1 ring-line hover:bg-cream">{l}</a>
        ))}
      </nav>
      <div className="grid gap-5 [&>section]:scroll-mt-20">
        <GeneralSettings store={store} storeName={branding.store_name} />
        <PaymentSettings store={store} instapay={instapay} />
        <DeliverySettings store={store} areas={(areas ?? []).map((a) => ({ ...a, fee: Number(a.fee) }))} pickup={pickup} />
        <InventorySettings store={store} />
        <Link href="/admin/notifications" className="flex items-center gap-3 rounded-[20px] bg-white p-5 ring-1 ring-line hover:ring-pink-soft">
          <Bell className="h-5 w-5 text-pink-ink" />
          <span className="flex-1"><span className="block font-bold">Notifications</span><span className="text-sm text-cocoa-muted">Telegram is {telegramConfigured() ? "connected" : "not connected yet"}. Test it and retry failed alerts.</span></span>
          <ChevronRight className="h-5 w-5" />
        </Link>
      </div>
    </>
  );
}
