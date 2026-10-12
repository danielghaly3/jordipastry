import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/shell";
import { requireAdmin } from "@/lib/auth";
import { getPublicSettings } from "@/lib/data";

export const metadata: Metadata = { title: { default: "Dashboard", template: "%s | Dashboard" }, robots: { index: false, follow: false } };

export default async function DashLayout({ children }: { children: React.ReactNode }) {
  const { supabase } = await requireAdmin();
  const [{ branding }, attention, alerts] = await Promise.all([
    getPublicSettings(),
    supabase.from("orders").select("id", { count: "exact", head: true }).or("fulfillment_status.eq.received,and(payment_status.eq.reported,fulfillment_status.neq.canceled)"),
    supabase.from("notification_logs").select("id", { count: "exact", head: true }).eq("status", "failed"),
  ]);
  return (
    <AdminShell storeName={branding.store_name} attention={attention.count ?? 0} alerts={alerts.count ?? 0}>
      {children}
    </AdminShell>
  );
}
