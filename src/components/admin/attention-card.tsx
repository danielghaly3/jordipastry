"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ChefHat, Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { updateOrder } from "@/app/admin/actions/orders";
import { PaymentPill, StatusPill } from "@/components/admin/ui";
import { btn } from "@/components/ui/button";
import { formatEGP, relativeTime } from "@/lib/format";
import type { OrderRow } from "@/lib/admin-orders";

/** Compact card for orders that need the owner: one obvious next tap. */
export function AttentionCard({ order, whatsappUrl }: { order: OrderRow; whatsappUrl: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const paid = order.payment_status === "verified";
  const reported = order.payment_status === "reported";

  return (
    <li className="rounded-[18px] bg-white p-4 ring-1 ring-line">
      <Link href={`/admin/orders/${order.id}`} className="block">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-lg font-bold">#{order.order_number}</p>
            <p className="font-semibold">{order.customer_name}</p>
          </div>
          <div className="text-right">
            <p className="font-display text-lg font-bold">{formatEGP(order.total)}</p>
            <p className="text-sm text-cocoa-muted">{relativeTime(order.created_at)}</p>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-2"><StatusPill status={order.fulfillment_status} /><PaymentPill status={order.payment_status} /></div>
      </Link>
      <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
        {reported || (!paid && order.payment_method === "instapay") ? (
          <Link href={`/admin/orders/${order.id}`} className={btn(reported ? "good" : "secondary", "md", "w-full")}>{reported ? "Check & Confirm Payment" : "Open order"}</Link>
        ) : (
          <button
            type="button"
            disabled={pending}
            className={btn("primary", "md", "w-full")}
            onClick={async () => {
              const res = await updateOrder(order.id, "start_preparing");
              if (!res.ok) return toast.error(res.error);
              toast.success(`#${order.order_number} is now preparing`);
              start(() => router.refresh());
            }}
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChefHat className="h-4 w-4" />} Start Preparing
          </button>
        )}
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={btn("secondary", "md", "!px-4")} aria-label={`WhatsApp ${order.customer_name}`}><MessageCircle className="h-5 w-5" /></a>
      </div>
    </li>
  );
}
