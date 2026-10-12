import { formatEGP } from "@/lib/format";
import { itemLine } from "@/lib/telegram";
import type { TrackedOrder } from "@/lib/data";

export function OrderSummary({ order }: { order: TrackedOrder }) {
  return (
    <div>
      <ul className="divide-y divide-line">
        {order.items.map((i) => (
          <li key={i.id} className="flex justify-between gap-4 py-3">
            <span className="text-[15px]">{itemLine(i)}</span>
            <span className="shrink-0 font-semibold">{formatEGP(i.line_total)}</span>
          </li>
        ))}
      </ul>
      <dl className="mt-2 space-y-1.5 border-t border-line pt-3 text-[15px]">
        <div className="flex justify-between"><dt className="text-cocoa-muted">Subtotal</dt><dd>{formatEGP(order.subtotal)}</dd></div>
        <div className="flex justify-between">
          <dt className="text-cocoa-muted">{order.fulfillment_method === "pickup" ? "Pickup" : `Delivery (${order.delivery_area_name})`}</dt>
          <dd>{order.delivery_fee > 0 ? formatEGP(order.delivery_fee) : "Free"}</dd>
        </div>
        <div className="flex items-baseline justify-between pt-1"><dt className="font-semibold">Total</dt><dd className="font-display text-2xl font-bold">{formatEGP(order.total)}</dd></div>
      </dl>
    </div>
  );
}
