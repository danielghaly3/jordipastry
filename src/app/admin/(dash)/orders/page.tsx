import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ClipboardList } from "lucide-react";
import { OrderFilters } from "@/components/admin/order-filters";
import { OrderList } from "@/components/admin/order-list";
import { EmptyState, PageHeader } from "@/components/admin/ui";
import { btn } from "@/components/ui/button";
import { listOrders, type OrderFilters as F } from "@/lib/admin-orders";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Orders" };
const PAGE = 50;

export default async function OrdersPage({ searchParams }: { searchParams: Promise<F & { page?: string }> }) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();
  const page = Math.max(1, Number(sp.page) || 1);
  const { orders, count } = await listOrders(supabase, sp, PAGE, (page - 1) * PAGE);
  const filtered = Boolean(sp.q || sp.payment || sp.status || sp.from || sp.to || sp.view);
  const next = new URLSearchParams(Object.entries(sp).filter(([, v]) => v) as [string, string][]);
  next.set("page", String(page + 1));

  return (
    <>
      <PageHeader title="Orders" description={`${count} order${count === 1 ? "" : "s"}${filtered ? " match your filters" : " in total"}. Newest first.`} />
      <Suspense><OrderFilters /></Suspense>
      {orders.length === 0 ? (
        <EmptyState icon={ClipboardList} title={filtered ? "No orders match" : "No orders yet"} text={filtered ? "Try clearing a filter." : "New orders will show up here, and you'll get a Telegram alert."} />
      ) : (
        <>
          <OrderList orders={orders} />
          {page * PAGE < count && <div className="mt-6 text-center"><Link href={`/admin/orders?${next}`} className={btn("secondary", "md")}>Show older orders</Link></div>}
        </>
      )}
    </>
  );
}
