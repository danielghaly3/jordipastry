"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Ban, Bike, CheckCheck, ChefHat, CircleCheck, Loader2, MessageCircle, PackageCheck, Phone, Undo2, X } from "lucide-react";
import { toast } from "sonner";
import { updateOrder, type OrderAction } from "@/app/admin/actions/orders";
import { ConfirmDialog } from "@/components/admin/controls";
import { btn } from "@/components/ui/button";
import { formatEGP } from "@/lib/format";
import type { Order } from "@/lib/types";

type Props = { order: Pick<Order, "id" | "order_number" | "total" | "payment_method" | "payment_status" | "fulfillment_status" | "fulfillment_method">; whatsappUrl: string; phone: string };

export function OrderActions({ order, whatsappUrl, phone }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = async (action: OrderAction, note?: string, success?: string) => {
    const res = await updateOrder(order.id, action, note);
    if (!res.ok) { toast.error(res.error); return false; }
    toast.success(success ?? "Updated");
    start(() => router.refresh());
    return true;
  };

  const f = order.fulfillment_status;
  const p = order.payment_status;
  const open = f !== "canceled" && f !== "completed";
  const needsPayment = f !== "canceled" && (p === "pending" || p === "reported" || p === "rejected");
  const amount = formatEGP(order.total);

  const next: { action: OrderAction; label: string; icon: typeof ChefHat; done: string } | null =
    f === "received" ? { action: "start_preparing", label: "Start Preparing", icon: ChefHat, done: "Marked as preparing" }
    : f === "preparing" ? { action: "mark_ready", label: "Mark Ready", icon: PackageCheck, done: "Marked as ready" }
    : f === "ready" && order.fulfillment_method === "delivery" ? { action: "out_for_delivery", label: "Out for Delivery", icon: Bike, done: "Marked as out for delivery" }
    : f === "ready" || f === "out_for_delivery" ? { action: "complete", label: "Complete Order", icon: CheckCheck, done: "Order completed" }
    : null;

  const confirmPayment = needsPayment && (
    <ConfirmDialog
      title={order.payment_method === "instapay" ? "Confirm this InstaPay payment?" : "Mark this order as paid?"}
      body={order.payment_method === "instapay"
        ? <>Open your InstaPay app first and make sure you received <strong>{amount}</strong> for order #{order.order_number}.</>
        : <>Only do this after you received <strong>{amount}</strong> in cash.</>}
      check={order.payment_method === "instapay" ? `I checked my InstaPay app and received ${amount}` : `I received ${amount} in cash`}
      confirmLabel="Yes, payment received"
      tone="good"
      onConfirm={() => run("confirm_payment", undefined, "Payment confirmed")}
      trigger={(o) => (
        <button type="button" onClick={o} className={btn("good", "lg", "w-full")}>
          <CircleCheck className="h-5 w-5" /> {order.payment_method === "instapay" ? "Confirm Payment" : "Mark as Paid"}
        </button>
      )}
    />
  );

  const nextButton = next && (
    <button type="button" disabled={pending} onClick={() => run(next.action, undefined, next.done)} className={btn(needsPayment ? "secondary" : "primary", "lg", "w-full")}>
      {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : <next.icon className="h-5 w-5" />} {next.label}
    </button>
  );

  return (
    <div className="space-y-3">
      {confirmPayment}
      {p === "reported" && f !== "canceled" && (
        <ConfirmDialog
          title="Reject this payment report?"
          body="Use this when you can't find the transfer. The customer will see your reason on their order page and can try again."
          note={{ label: "Reason for the customer", required: true, placeholder: "e.g. We haven't received a transfer of this amount yet." }}
          confirmLabel="Reject report"
          tone="danger"
          onConfirm={(note) => run("reject_payment", note, "Payment report rejected")}
          trigger={(o) => <button type="button" onClick={o} className={btn("secondary", "md", "w-full")}><X className="h-4 w-4" /> Reject Payment Report</button>}
        />
      )}
      {nextButton}
      {needsPayment && next && <p className="text-center text-sm text-cocoa-muted">Tip: confirm payment before you start preparing.</p>}

      <div className="grid grid-cols-2 gap-2 pt-1">
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className={btn("secondary", "md", "w-full")}><MessageCircle className="h-4 w-4" /> WhatsApp</a>
        <a href={`tel:${phone}`} className={btn("secondary", "md", "w-full")}><Phone className="h-4 w-4" /> Call</a>
      </div>

      <div className="flex flex-wrap gap-2 pt-2">
        {p === "verified" && (
          <ConfirmDialog
            title="Mark as refunded?"
            body={<>Only after you sent <strong>{amount}</strong> back to the customer. Refunded money is removed from your sales numbers.</>}
            confirmLabel="Mark refunded"
            tone="danger"
            onConfirm={() => run("refund", undefined, "Marked as refunded")}
            trigger={(o) => <button type="button" onClick={o} className={btn("ghost", "sm")}><Undo2 className="h-4 w-4" /> Mark refunded</button>}
          />
        )}
        {open && (
          <ConfirmDialog
            title={`Cancel order #${order.order_number}?`}
            body={p === "verified" ? "This order is already paid. After canceling, return the money and use Mark refunded." : "The customer will see it as canceled. Reserved stock goes back to your menu."}
            note={{ label: "Reason (optional, for your records)" }}
            confirmLabel="Cancel order"
            tone="danger"
            onConfirm={(note) => run("cancel", note || undefined, "Order canceled")}
            trigger={(o) => <button type="button" onClick={o} className={btn("ghost", "sm", "text-bad")}><Ban className="h-4 w-4" /> Cancel order</button>}
          />
        )}
      </div>
    </div>
  );
}
