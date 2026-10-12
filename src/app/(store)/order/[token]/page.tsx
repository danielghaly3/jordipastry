import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Bike, CircleX, Clock, CreditCard, MessageCircle, Store } from "lucide-react";
import { AutoRefresh } from "@/components/order/auto-refresh";
import { CopyButton } from "@/components/order/copy-button";
import { OrderSummary } from "@/components/order/order-summary";
import { ReviewForm } from "@/components/order/review-form";
import { btn } from "@/components/ui/button";
import { getOrderByToken, getPrivateSetting, getPublicSettings } from "@/lib/data";
import { firstName, formatDateTime, relativeTime } from "@/lib/format";
import { customerToShopMessage } from "@/lib/messages";
import { whatsappLink } from "@/lib/phone";
import { PAYMENT_LABEL, PAYMENT_METHOD_LABEL, PAYMENT_TONE, customerStepLabel, fulfillmentSteps } from "@/lib/status";

export const metadata: Metadata = { title: "Track your order", robots: { index: false, follow: false } };

const TONE = { neutral: "bg-white text-cocoa ring-1 ring-line", warn: "bg-warn-tint text-warn", good: "bg-good-tint text-good", bad: "bg-bad-tint text-bad", info: "bg-info-tint text-info" };

export default async function TrackPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const order = await getOrderByToken(token);
  if (!order) notFound();
  const [{ contact, store }, pickup] = await Promise.all([getPublicSettings(), order.fulfillment_method === "pickup" ? getPrivateSetting("pickup") : null]);

  const canceled = order.fulfillment_status === "canceled";
  const steps = fulfillmentSteps(order.fulfillment_method);
  const currentIdx = steps.indexOf(order.fulfillment_status);
  const reachedAt = (s: string) => order.history.find((h) => h.kind === "fulfillment" && h.to_status === s)?.created_at;
  const terminal = canceled || order.fulfillment_status === "completed";
  const needsPayment = order.payment_method === "instapay" && !canceled && (order.payment_status === "pending" || order.payment_status === "rejected");
  const card = "rounded-[28px] bg-white p-6 shadow-cloud md:p-8";

  return (
    <div className="mx-auto max-w-[920px] px-5 pb-16 pt-8 md:px-8 md:pt-12">
      {!terminal && <AutoRefresh />}
      <p className="text-cocoa-muted">Hi {firstName(order.customer_name)}, here&apos;s your order</p>
      <div className="mt-1 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-[clamp(1.8rem,4vw,2.6rem)] font-bold leading-tight">#{order.order_number}</h1>
        <CopyButton value={order.order_number} label="Copy order number" />
      </div>
      <p className="mt-1 text-sm text-cocoa-muted">Placed {formatDateTime(order.created_at)} · Updated {relativeTime(order.updated_at)}</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section className={card} aria-labelledby="progress">
          <h2 id="progress" className="font-display text-2xl font-semibold">Progress</h2>
          {canceled ? (
            <div className="mt-5 flex items-start gap-3 rounded-2xl bg-bad-tint p-5 text-bad">
              <CircleX className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">This order was canceled</p>
                {reachedAt("canceled") && <p className="text-sm">{formatDateTime(reachedAt("canceled"))}</p>}
              </div>
            </div>
          ) : (
            <ol className="relative mt-6 space-y-0">
              {steps.map((s, i) => {
                const done = i < currentIdx;
                const now = i === currentIdx;
                const at = reachedAt(s);
                return (
                  <li key={s} className="relative flex gap-4 pb-7 last:pb-0">
                    {i < steps.length - 1 && <span className={`absolute left-[19px] top-10 h-[calc(100%-36px)] w-1 rounded-full ${done ? "bg-pink-ink" : "bg-line"}`} aria-hidden="true" />}
                    <span className={`relative grid h-10 w-10 shrink-0 place-items-center rounded-full font-display font-bold ${now ? "bg-pink-ink text-white" : done ? "bg-pink-soft text-pink-ink" : "bg-cream text-cocoa-muted ring-1 ring-line"}`}>
                      {now && <span className="absolute -top-3 h-2.5 w-8 rounded-[50%] border-[3px] border-accent" aria-hidden="true" />}
                      {i + 1}
                    </span>
                    <div className="pt-1.5">
                      <p className={`font-semibold ${now ? "text-pink-ink" : done ? "" : "text-cocoa-muted"}`}>
                        {customerStepLabel(s, order.fulfillment_method)}
                        {now && <span className="sr-only"> (current step)</span>}
                      </p>
                      {at && (done || now) && <p className="text-sm text-cocoa-muted">{formatDateTime(at)}</p>}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        <div className="space-y-6">
          <section className={card} aria-labelledby="payment">
            <h2 id="payment" className="flex items-center gap-2 font-display text-2xl font-semibold"><CreditCard className="h-6 w-6 text-pink-ink" /> Payment</h2>
            <p className="mt-3 text-cocoa-muted">{PAYMENT_METHOD_LABEL[order.payment_method]}</p>
            <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-bold ${TONE[PAYMENT_TONE[order.payment_status]]}`}>{PAYMENT_LABEL[order.payment_status]}</span>
            {order.payment_status === "rejected" && order.payment?.rejection_reason && <p className="mt-3 text-sm text-bad">{order.payment.rejection_reason}</p>}
            {needsPayment && <Link href={`/checkout/payment/${token}`} className={btn("primary", "md", "mt-4 w-full")}>Complete payment</Link>}
          </section>

          <section className={card} aria-labelledby="fulfil">
            <h2 id="fulfil" className="flex items-center gap-2 font-display text-2xl font-semibold">
              {order.fulfillment_method === "pickup" ? <Store className="h-6 w-6 text-pink-ink" /> : <Bike className="h-6 w-6 text-pink-ink" />}
              {order.fulfillment_method === "pickup" ? "Pickup" : "Delivery"}
            </h2>
            {order.fulfillment_method === "delivery" ? (
              <p className="mt-3 text-[15px]"><strong>{order.delivery_area_name}</strong><br />{order.delivery_address}</p>
            ) : (
              <p className="mt-3 whitespace-pre-line text-[15px]">{pickup?.instructions || "We'll message you with pickup details when your order is ready."}</p>
            )}
            {order.requested_for && <p className="mt-3 flex items-center gap-2 text-[15px]"><Clock className="h-4 w-4" /> Requested for {formatDateTime(order.requested_for)}</p>}
            {!order.requested_for && store.prep_time_text && !terminal && <p className="mt-3 flex items-center gap-2 text-[15px]"><Clock className="h-4 w-4" /> {store.prep_time_text}</p>}
          </section>
        </div>
      </div>

      <section className={`${card} mt-6`} aria-labelledby="items">
        <h2 id="items" className="font-display text-2xl font-semibold">Items</h2>
        <OrderSummary order={order} />
        {order.notes && <p className="mt-4 rounded-2xl bg-cream px-4 py-3 text-[15px]"><strong>Your note:</strong> {order.notes}</p>}
      </section>

      {order.fulfillment_status === "completed" && !order.has_review && (
        <section className={`${card} mt-6`} aria-labelledby="review">
          <h2 id="review" className="font-display text-2xl font-semibold">How were your treats?</h2>
          <p className="mb-5 mt-1 text-cocoa-muted">Your review helps other sweet tooths. It goes live on our homepage right away.</p>
          <ReviewForm token={token} defaultName={firstName(order.customer_name)} />
        </section>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {contact.whatsapp && (
          <a href={whatsappLink(contact.whatsapp, customerToShopMessage(order.order_number))} target="_blank" rel="noopener noreferrer" className={btn("primary", "lg")}>
            <MessageCircle className="h-5 w-5" /> Ask about this order
          </a>
        )}
        <Link href="/menu" className={btn("secondary", "lg")}>Order more treats</Link>
      </div>
      {!terminal && <p className="mt-4 text-center text-sm text-cocoa-muted">This page updates by itself.</p>}
    </div>
  );
}
