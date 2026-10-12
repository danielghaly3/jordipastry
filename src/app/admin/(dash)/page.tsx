import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Banknote, CalendarDays, ChefHat, CircleCheck, ClipboardList, Clock, CreditCard, Plus, ShoppingBag, Wallet } from "lucide-react";
import { AttentionCard } from "@/components/admin/attention-card";
import { BarsChart } from "@/components/admin/charts";
import { OrderList } from "@/components/admin/order-list";
import { StoreSwitch } from "@/components/admin/store-switch";
import { Card, EmptyState } from "@/components/admin/ui";
import { btn } from "@/components/ui/button";
import { listOrders } from "@/lib/admin-orders";
import { getDashboard, shortDay } from "@/lib/admin-stats";
import { requireAdmin } from "@/lib/auth";
import { getPrivateSetting, getPublicSettings } from "@/lib/data";
import { formatDate, formatEGP } from "@/lib/format";
import { ownerToCustomerMessage } from "@/lib/messages";
import { whatsappLink } from "@/lib/phone";
import { telegramConfigured } from "@/lib/telegram";

export const metadata: Metadata = { title: "Overview" };

export default async function OverviewPage() {
  const { supabase, profile } = await requireAdmin();
  const [dash, attention, recent, settings, instapay, samples] = await Promise.all([
    getDashboard(supabase, 14),
    listOrders(supabase, { view: "action" }, 6),
    listOrders(supabase, {}, 8),
    getPublicSettings(),
    getPrivateSetting("instapay"),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("is_sample", true).is("archived_at", null),
  ]);
  const s = dash.summary;
  const stats = [
    { label: "Today's orders", value: s.today_orders, icon: CalendarDays },
    { label: "New (not started)", value: s.new_orders, icon: ClipboardList, href: "/admin/orders?status=received", hot: s.new_orders > 0 },
    { label: "Awaiting payment check", value: s.awaiting_verification, icon: CreditCard, href: "/admin/orders?payment=reported", hot: s.awaiting_verification > 0 },
    { label: "Unpaid orders", value: s.pending_payment, icon: Clock, href: "/admin/orders?payment=pending" },
    { label: "Preparing", value: s.preparing, icon: ChefHat, href: "/admin/orders?status=preparing" },
    { label: "Completed", value: s.completed, icon: CircleCheck, href: "/admin/orders?status=completed" },
    { label: "Total orders", value: s.total_orders, icon: ShoppingBag, href: "/admin/orders" },
    { label: "Today's verified sales", value: formatEGP(dash.sales.today), icon: Wallet, money: true },
    { label: "This month's verified sales", value: formatEGP(dash.sales.month), icon: Banknote, money: true },
  ];
  const warnings = [
    (samples.count ?? 0) > 0 && { text: `${samples.count} sample products are still on your menu. Replace or delete them before launch.`, href: "/admin/products", cta: "Review products" },
    !instapay.identifier && settings.store.instapay_enabled && { text: "Your InstaPay details aren't set, so customers can't see where to pay.", href: "/admin/settings#payment", cta: "Add InstaPay" },
    !telegramConfigured() && { text: "Telegram alerts aren't connected yet. You won't get new-order alerts.", href: "/admin/notifications", cta: "Set up" },
  ].filter(Boolean) as { text: string; href: string; cta: string }[];
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: "Africa/Cairo" }).format(new Date()));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-cocoa-muted">{formatDate(new Date())}</p>
          <h1 className="font-display text-3xl font-bold md:text-4xl">Good {hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening"}{profile.display_name ? `, ${profile.display_name}` : ""}!</h1>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
          <Link href="/admin/products/new" className={btn("primary", "md", "!px-4")}><Plus className="h-4 w-4" /> Add Product</Link>
          <Link href="/admin/orders?view=action" className={btn("secondary", "md", "!px-4")}>New Orders</Link>
        </div>
      </div>

      {warnings.map((w) => (
        <div key={w.href} className="grid grid-cols-[auto_1fr] items-start gap-x-3 gap-y-1 rounded-[18px] bg-warn-tint px-4 py-3 text-warn sm:grid-cols-[auto_1fr_auto] sm:items-center">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 sm:mt-0" />
          <p className="font-semibold">{w.text}</p>
          <Link href={w.href} className="col-start-2 font-bold underline sm:col-start-3">{w.cta}</Link>
        </div>
      ))}

      <StoreSwitch open={settings.store.accepting_orders} />

      <Card title={`Needs your attention${attention.count ? ` (${attention.count})` : ""}`} action={attention.count > 6 && <Link href="/admin/orders?view=action" className="font-semibold text-pink-ink">See all</Link>}>
        {attention.orders.length === 0 ? (
          <EmptyState icon={CircleCheck} title="All caught up!" text="New orders and payment reports will appear here." />
        ) : (
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {attention.orders.map((o) => (
              <AttentionCard key={o.id} order={o} whatsappUrl={whatsappLink(o.customer_phone, ownerToCustomerMessage(o, settings.branding.store_name))} />
            ))}
          </ul>
        )}
      </Card>

      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-3">
        {stats.map((st) => {
          const inner = (
            <>
              <span className="flex items-center gap-2 text-sm font-semibold text-cocoa-muted"><st.icon className="h-4 w-4" /> {st.label}</span>
              <span className={`mt-2 block font-display font-bold ${st.money ? "text-2xl md:text-3xl" : "text-3xl md:text-4xl"} ${st.hot ? "text-pink-ink" : ""}`}>{st.value}</span>
            </>
          );
          return (
            <li key={st.label} className={st.money ? "col-span-2 md:col-span-1" : ""}>
              {st.href ? (
                <Link href={st.href} className="block h-full rounded-[20px] bg-white p-4 ring-1 ring-line transition hover:ring-pink-soft md:p-5">{inner}</Link>
              ) : (
                <div className="h-full rounded-[20px] bg-white p-4 ring-1 ring-line md:p-5">{inner}</div>
              )}
            </li>
          );
        })}
      </ul>
      <p className="-mt-3 text-sm text-cocoa-muted">Sales only count payments you confirmed. Unverified transfers are not included.</p>

      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <Card title="Orders, last 14 days" action={<Link href="/admin/analytics" className="inline-flex items-center gap-1 font-semibold text-pink-ink">Analytics <ArrowRight className="h-4 w-4" /></Link>}>
          <BarsChart label="Orders per day for the last 14 days" data={dash.orders_by_day.map((d) => ({ label: shortDay(d.date), value: d.orders }))} />
        </Card>
        <Card title="Recent orders" action={<Link href="/admin/orders" className="font-semibold text-pink-ink">All orders</Link>}>
          {recent.orders.length === 0 ? <EmptyState icon={ClipboardList} title="No orders yet" text="Share your website link to get the first one!" /> : <OrderList cards orders={recent.orders.slice(0, 4)} />}
        </Card>
      </div>
    </div>
  );
}
