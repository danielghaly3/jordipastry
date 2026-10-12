import type { Metadata } from "next";
import Link from "next/link";
import { BarsChart, HBarsChart } from "@/components/admin/charts";
import { Card, PageHeader } from "@/components/admin/ui";
import { getDashboard, shortDay, shortMonth } from "@/lib/admin-stats";
import { requireAdmin } from "@/lib/auth";
import { formatEGP } from "@/lib/format";
import { PAYMENT_LABEL } from "@/lib/status";
import type { PaymentStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Analytics" };
const RANGES = [7, 30, 90];
const PAYMENT_COLORS: Record<PaymentStatus, string> = { pending: "#b9a29d", reported: "#c98a1a", verified: "#1f7a4d", rejected: "#b3261e", refunded: "#2952a3" };

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const days = RANGES.includes(Number((await searchParams).days)) ? Number((await searchParams).days) : 30;
  const { supabase } = await requireAdmin();
  const d = await getDashboard(supabase, days);
  const orders = d.orders_by_day.reduce((s, x) => s + x.orders, 0);
  const verifiedCount = d.payment_breakdown.verified ?? 0;
  const payments = (Object.keys(PAYMENT_LABEL) as PaymentStatus[]).filter((k) => d.payment_breakdown[k]).map((k) => ({ label: PAYMENT_LABEL[k], value: d.payment_breakdown[k], color: PAYMENT_COLORS[k] }));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Analytics"
        description="Sales only include payments you confirmed. Canceled orders are left out of order counts."
        actions={
          <div className="flex gap-1 rounded-full bg-white p-1 ring-1 ring-line" role="group" aria-label="Date range">
            {RANGES.map((r) => <Link key={r} href={`/admin/analytics?days=${r}`} aria-current={r === days ? "true" : undefined} className={`grid h-9 place-items-center rounded-full px-4 text-sm font-bold ${r === days ? "bg-cocoa text-cream" : ""}`}>{r} days</Link>)}
          </div>
        }
      />
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Verified sales", formatEGP(d.sales.range), `last ${days} days`],
          ["Orders", String(orders), `last ${days} days`],
          ["Average paid order", verifiedCount ? formatEGP(Math.round((d.sales.range / verifiedCount) * 100) / 100) : "No sales yet", "verified orders"],
          ["All-time verified sales", formatEGP(d.sales.all_time), "since you started"],
        ].map(([label, value, sub]) => (
          <li key={label} className="rounded-[20px] bg-white p-4 ring-1 ring-line md:p-5">
            <p className="text-sm font-semibold text-cocoa-muted">{label}</p>
            <p className="mt-1 font-display text-2xl font-bold md:text-3xl">{value}</p>
            <p className="text-xs text-cocoa-muted">{sub}</p>
          </li>
        ))}
      </ul>
      <Card title={`Orders per day (last ${days} days)`}>
        <BarsChart label="Orders per day" data={d.orders_by_day.map((x) => ({ label: shortDay(x.date), value: x.orders }))} />
      </Card>
      <div className="grid gap-5 xl:grid-cols-2">
        <Card title="Verified revenue by week">
          <BarsChart money label="Verified revenue per week, last 12 weeks" color="var(--good)" data={d.revenue_by_week.map((x) => ({ label: shortDay(x.week), value: x.revenue }))} />
        </Card>
        <Card title="Verified revenue by month">
          <BarsChart money label="Verified revenue per month, last 12 months" color="var(--good)" data={d.revenue_by_month.map((x) => ({ label: shortMonth(x.month), value: x.revenue }))} />
        </Card>
        <Card title={`Most popular flavors (last ${days} days)`}>
          <p className="-mt-2 mb-3 text-sm text-cocoa-muted">Donuts sold, including those inside boxes.</p>
          <HBarsChart label="Donuts sold per flavor" data={d.popular_products.map((p) => ({ label: p.name, value: p.quantity }))} />
        </Card>
        <Card title={`Payment status (last ${days} days)`}>
          <HBarsChart label="Orders by payment status" data={payments.map(({ label, value }) => ({ label, value }))} colors={payments.map((p) => p.color)} />
        </Card>
      </div>
    </div>
  );
}
