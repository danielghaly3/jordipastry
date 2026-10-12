import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PaymentPill, StatusPill } from "@/components/admin/ui";
import { formatEGP, relativeTime, formatDateTime } from "@/lib/format";
import type { OrderRow } from "@/lib/admin-orders";

export function OrderList({ orders, cards = false }: { orders: OrderRow[]; cards?: boolean }) {
  return (
    <>
      {/* Phone: tappable cards */}
      <ul className={`grid gap-3 ${cards ? "" : "md:hidden"}`}>
        {orders.map((o) => (
          <li key={o.id}>
            <Link href={`/admin/orders/${o.id}`} className="block rounded-[18px] bg-white p-4 ring-1 ring-line active:bg-cream">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg font-bold">#{o.order_number}</p>
                  <p className="font-semibold">{o.customer_name}</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-lg font-bold">{formatEGP(o.total)}</p>
                  <p className="text-sm text-cocoa-muted">{relativeTime(o.created_at)}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusPill status={o.fulfillment_status} />
                <PaymentPill status={o.payment_status} />
                <span className="ml-auto text-sm text-cocoa-muted">{o.fulfillment_method === "pickup" ? "Pickup" : o.delivery_area_name}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {/* Tablet/desktop: table */}
      <div className={`hidden overflow-hidden rounded-[20px] bg-white ring-1 ring-line ${cards ? "" : "md:block"}`}>
        <table className="w-full text-left text-[15px]">
          <thead className="bg-cream text-sm text-cocoa-muted">
            <tr>
              <th className="px-4 py-3 font-bold">Order</th>
              <th className="px-4 py-3 font-bold">Customer</th>
              <th className="px-4 py-3 font-bold">Amount</th>
              <th className="px-4 py-3 font-bold">Payment</th>
              <th className="px-4 py-3 font-bold">Status</th>
              <th className="px-4 py-3 font-bold">Placed</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {orders.map((o) => (
              <tr key={o.id} className="relative hover:bg-cream">
                <td className="px-4 py-3 font-bold">
                  <Link href={`/admin/orders/${o.id}`} className="after:absolute after:inset-0">#{o.order_number}</Link>
                </td>
                <td className="px-4 py-3">{o.customer_name}<span className="block text-sm text-cocoa-muted">{o.fulfillment_method === "pickup" ? "Pickup" : o.delivery_area_name}</span></td>
                <td className="px-4 py-3 font-semibold">{formatEGP(o.total)}</td>
                <td className="px-4 py-3"><PaymentPill status={o.payment_status} /></td>
                <td className="px-4 py-3"><StatusPill status={o.fulfillment_status} /></td>
                <td className="px-4 py-3 text-sm text-cocoa-muted" title={formatDateTime(o.created_at)}>{relativeTime(o.created_at)}</td>
                <td className="px-2"><ChevronRight className="h-4 w-4 text-cocoa-muted" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
