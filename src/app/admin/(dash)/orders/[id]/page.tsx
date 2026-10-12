import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, FileText } from "lucide-react";
import { OrderActions } from "@/components/admin/order-actions";
import { Card, PaymentPill, StatusPill } from "@/components/admin/ui";
import { CopyButton } from "@/components/order/copy-button";
import { requireAdmin } from "@/lib/auth";
import { getPublicSettings } from "@/lib/data";
import { formatDateTime, formatEGP } from "@/lib/format";
import { ownerToCustomerMessage } from "@/lib/messages";
import { prettyPhone, whatsappLink } from "@/lib/phone";
import { FULFILLMENT_ADMIN_LABEL, PAYMENT_LABEL, PAYMENT_METHOD_LABEL } from "@/lib/status";
import { createServiceClient } from "@/lib/supabase/server";
import type { FulfillmentStatus, Order, OrderItem, PaymentStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Order" };

type Full = Order & {
  items: OrderItem[];
  history: { id: string; kind: string; from_status: string | null; to_status: string; note: string | null; actor: string; created_at: string }[];
  payments: { id: string; amount: number; status: PaymentStatus; reference: string | null; receipt_path: string | null; reported_at: string | null; verified_at: string | null; rejection_reason: string | null; created_at: string }[];
};

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("orders").select("*,items:order_items(*),history:order_status_history(*),payments:payment_records(*)").eq("id", id).maybeSingle();
  if (!data) notFound();
  const order = data as unknown as Full;
  const { branding } = await getPublicSettings();
  const payment = [...order.payments].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];

  // Receipts live in a private bucket: a short-lived link, generated only after the admin check above.
  let receiptUrl: string | null = null;
  if (payment?.receipt_path) {
    const { data: signed } = await createServiceClient().storage.from("payment-receipts").createSignedUrl(payment.receipt_path, 600);
    receiptUrl = signed?.signedUrl ?? null;
  }
  const isPdf = payment?.receipt_path?.endsWith(".pdf");
  const history = [...order.history].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const label = (h: Full["history"][number]) => (h.kind === "payment" ? PAYMENT_LABEL[h.to_status as PaymentStatus] : FULFILLMENT_ADMIN_LABEL[h.to_status as FulfillmentStatus]);

  return (
    <>
      <Link href="/admin/orders" className="mb-3 inline-flex h-10 items-center gap-2 font-semibold text-cocoa-muted hover:text-pink-ink"><ArrowLeft className="h-4 w-4" /> Orders</Link>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl font-bold md:text-4xl">#{order.order_number}</h1>
        <CopyButton value={order.order_number} label="Copy order number" />
        <StatusPill status={order.fulfillment_status} />
        <PaymentPill status={order.payment_status} />
        <span className="w-full text-sm text-cocoa-muted md:ml-auto md:w-auto">Placed {formatDateTime(order.created_at)}</span>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <div className="order-2 space-y-5 lg:order-1">
          <Card title="Items">
            <ul className="divide-y divide-line">
              {order.items.map((i) => (
                <li key={i.id} className="flex justify-between gap-4 py-3">
                  <div>
                    <p className="font-semibold">{i.quantity} × {i.name}</p>
                    {i.options.length > 0 && <p className="text-sm text-cocoa-muted">{i.options.map((o) => o.name).join(", ")}</p>}
                    {i.box_contents.length > 0 && <p className="text-sm text-cocoa-muted">{i.box_contents.map((c) => `${c.quantity}× ${c.name}`).join(", ")}</p>}
                    <p className="text-sm text-cocoa-muted">{formatEGP(i.unit_price)} each</p>
                  </div>
                  <p className="font-semibold">{formatEGP(i.line_total)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-2 space-y-1.5 border-t border-line pt-3">
              <div className="flex justify-between"><dt className="text-cocoa-muted">Subtotal</dt><dd>{formatEGP(order.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-cocoa-muted">Delivery fee</dt><dd>{formatEGP(order.delivery_fee)}</dd></div>
              <div className="flex justify-between text-lg"><dt className="font-bold">Total</dt><dd className="font-display text-2xl font-bold">{formatEGP(order.total)}</dd></div>
            </dl>
          </Card>

          {order.notes && <Card title="Customer notes"><p className="whitespace-pre-line">{order.notes}</p></Card>}

          <Card title="Timeline">
            <ol className="space-y-3">
              {history.map((h) => (
                <li key={h.id} className="flex gap-3">
                  <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${h.kind === "payment" ? "bg-accent" : "bg-pink-ink"}`} aria-hidden="true" />
                  <div>
                    <p className="font-semibold">{h.kind === "payment" ? "Payment: " : ""}{label(h)} <span className="font-normal text-cocoa-muted">by {h.actor === "admin" ? "you" : h.actor}</span></p>
                    <p className="text-sm text-cocoa-muted">{formatDateTime(h.created_at)}</p>
                    {h.note && <p className="mt-1 rounded-xl bg-cream px-3 py-2 text-sm">{h.note}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="order-1 space-y-5 lg:order-2">
          <Card title="Next step">
            <OrderActions
              order={order}
              phone={order.customer_phone}
              whatsappUrl={whatsappLink(order.customer_whatsapp, ownerToCustomerMessage(order, branding.store_name))}
            />
          </Card>

          <Card title="Customer">
            <p className="text-lg font-bold">{order.customer_name}</p>
            <p className="mt-1"><a href={`tel:${order.customer_phone}`} className="font-semibold text-pink-ink hover:underline">{prettyPhone(order.customer_phone)}</a></p>
            {order.customer_whatsapp !== order.customer_phone && <p className="text-sm text-cocoa-muted">WhatsApp: {order.customer_whatsapp}</p>}
          </Card>

          <Card title={order.fulfillment_method === "pickup" ? "Pickup" : "Delivery"}>
            {order.fulfillment_method === "delivery" ? (
              <>
                <p className="font-semibold">{order.delivery_area_name}</p>
                <p className="whitespace-pre-line">{order.delivery_address}</p>
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${order.delivery_address}, ${order.delivery_area_name}`)}`} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-pink-ink hover:underline">Open in Maps <ExternalLink className="h-3.5 w-3.5" /></a>
              </>
            ) : <p>Customer will pick up.</p>}
            {order.requested_for && <p className="mt-3 rounded-xl bg-warn-tint px-3 py-2 font-semibold text-warn">Requested for {formatDateTime(order.requested_for)}</p>}
          </Card>

          <Card title="Payment">
            <dl className="space-y-2 text-[15px]">
              <div className="flex justify-between gap-2"><dt className="text-cocoa-muted">Method</dt><dd className="font-semibold">{PAYMENT_METHOD_LABEL[order.payment_method]}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-cocoa-muted">Status</dt><dd><PaymentPill status={order.payment_status} /></dd></div>
              {payment?.reported_at && <div className="flex justify-between gap-2"><dt className="text-cocoa-muted">Customer reported</dt><dd>{formatDateTime(payment.reported_at)}</dd></div>}
              {payment?.reference && <div className="flex justify-between gap-2"><dt className="text-cocoa-muted">Reference</dt><dd className="break-all font-semibold">{payment.reference}</dd></div>}
              {payment?.verified_at && <div className="flex justify-between gap-2"><dt className="text-cocoa-muted">Verified</dt><dd>{formatDateTime(payment.verified_at)}</dd></div>}
              {payment?.rejection_reason && <div><dt className="text-cocoa-muted">Rejection reason</dt><dd>{payment.rejection_reason}</dd></div>}
            </dl>
            {receiptUrl && (
              <div className="mt-4">
                <p className="mb-2 text-sm font-bold">Receipt from customer</p>
                {isPdf ? (
                  <a href={receiptUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-semibold text-pink-ink underline"><FileText className="h-4 w-4" /> Open PDF receipt</a>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <a href={receiptUrl} target="_blank" rel="noopener noreferrer"><img src={receiptUrl} alt="Payment receipt uploaded by the customer" className="max-h-80 w-full rounded-xl object-contain ring-1 ring-line" /></a>
                )}
                <p className="mt-1 text-xs text-cocoa-muted">A receipt can be faked. Always check your InstaPay app.</p>
              </div>
            )}
            <a href={`/order/${order.public_token}`} target="_blank" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-pink-ink hover:underline">Customer&apos;s tracking page <ExternalLink className="h-3.5 w-3.5" /></a>
          </Card>
        </div>
      </div>
    </>
  );
}
