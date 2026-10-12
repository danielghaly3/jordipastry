import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export type Dashboard = {
  summary: { total_orders: number; today_orders: number; new_orders: number; pending_payment: number; awaiting_verification: number; preparing: number; completed: number; canceled: number };
  sales: { today: number; month: number; all_time: number; range: number };
  orders_by_day: { date: string; orders: number }[];
  revenue_by_week: { week: string; revenue: number }[];
  revenue_by_month: { month: string; revenue: number }[];
  popular_products: { name: string; quantity: number }[];
  payment_breakdown: Record<string, number>;
};

export async function getDashboard(supabase: SupabaseClient, days = 30): Promise<Dashboard> {
  const { data, error } = await supabase.rpc("admin_dashboard", { p_days: days });
  if (error) throw new Error(error.message);
  const d = data as Dashboard;
  const n = (v: unknown) => Number(v ?? 0);
  return {
    ...d,
    sales: { today: n(d.sales.today), month: n(d.sales.month), all_time: n(d.sales.all_time), range: n(d.sales.range) },
    revenue_by_week: d.revenue_by_week.map((r) => ({ ...r, revenue: n(r.revenue) })),
    revenue_by_month: d.revenue_by_month.map((r) => ({ ...r, revenue: n(r.revenue) })),
  };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const shortDay = (iso: string) => `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]}`;
export const shortMonth = (iso: string) => `${MONTHS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(2, 4)}`;
