import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CircleCheck, MessageCircle, ShieldCheck } from "lucide-react";
import { Mascot } from "@/components/brand/mascot";
import { CheckoutSteps } from "@/components/checkout/steps";
import { Celebrate } from "@/components/order/celebrate";
import { CopyButton } from "@/components/order/copy-button";
import { OrderSummary } from "@/components/order/order-summary";
import { ReportPayment } from "@/components/order/report-payment";
import { btn } from "@/components/ui/button";
import { getOrderByToken, getPrivateSetting, getPublicSettings } from "@/lib/data";
import { formatEGP } from "@/lib/format";
import { customerToShopMessage } from "@/lib/messages";
import { whatsappLink } from "@/lib/phone";

export const metadata: Metadata = { title: "Payment", robots: { index: false, follow: false } };

type Props = { params: Promise<{ token: string }>; searchParams: Promise<{ new?: string }> };

export default async function PaymentPage({ params, searchParams }: Props) {
  const [{ token }, { new: isNew }] = await Promise.all([params, searchParams]);
  const order = await getOrderByToken(token);
  if (!order) notFound();
  const [instapay, { contact }] = await Promise.all([getPrivateSetting("instapay"), getPublicSettings()]);
  const configured = Boolean(instapay.identifier);
  const amount = formatEGP(order.total);
  const status = order.payment_status;
  const canceled = order.fulfillment_status === "canceled";

  const card = "rounded-[28px] bg-white p-6 shadow-cloud md:p-8";

  return (
    <div className="mx-auto max-w-[760px] px-5 pb-16 pt-8 md:px-8 md:pt-12">
      <CheckoutSteps current={status === "verified" || order.payment_method === "cash" ? 3 : 2} />

      <div className="mt-8 text-center">
        {isNew && (
          <div className="relative mx-auto h-40 w-64">
            <Mascot pose="celebrate" className="absolute left-1/2 top-0 h-36 w-36 -translate-x-1/2" />
            <div className="absolute bottom-0 right-0 scale-75"><Celebrate /></div>
          </div>
        )}
        <h1 className="mt-6 font-display text-[clamp(1.9rem,4.8vw,3rem)] font-bold leading-[1.1] tracking-[-0.02em]">
          {canceled ? "Order canceled" : order.payment_method === "cash" ? "Order placed!" : status === "verified" ? "Payment confirmed!" : status === "reported" ? "Thank you!" : "Almost There!"}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-lg text-cocoa-muted">
          {canceled
            ? "This order was canceled. Message us if you have any questions."
            : order.payment_method === "cash"
              ? `Please have ${amount} ready in cash when you ${order.fulfillment_method === "pickup" ? "pick up your order" : "receive your order"}.`
              : status === "verified"
                ? "We've received your payment. Your donuts are on their way to the oven."
                : status === "reported"
                  ? "We'll confirm your order as soon as we see the transfer in our InstaPay account."
                  : "Your donuts are one step closer. Complete your InstaPay transfer to confirm your order."}
        </p>
        <div className="mt-5 inline-flex items-center gap-3 rounded-full bg-white py-1.5 pl-5 pr-1.5 shadow-cloud">
          <span className="text-sm text-cocoa-muted">Order</span>
          <span className="font-display text-xl font-bold">#{order.order_number}</span>
          <CopyButton value={order.order_number} label="Copy order number" />
        </div>
      </div>

      {order.payment_method === "instapay" && !canceled && (status === "pending" || status === "rejected") && (
        <section className={`${card} mt-8`} aria-labelledby="pay-title">
          {status === "rejected" && (
            <div className="mb-6 rounded-2xl bg-bad-tint px-5 py-4 text-bad">
              <p className="font-semibold">We couldn&apos;t verify your payment yet.</p>
              {order.payment?.rejection_reason && <p className="mt-1">{order.payment.rejection_reason}</p>}
            </div>
          )}
          <h2 id="pay-title" className="font-display text-2xl font-semibold">Send with InstaPay</h2>
          <div className="mt-5 rounded-[24px] bg-pink-tint p-5">
            <p className="text-sm font-semibold text-cocoa-muted">Amount due</p>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-display text-4xl font-bold text-pink-ink">{amount}</p>
              <CopyButton value={String(order.total)} label="Copy amount" />
            </div>
            {configured ? (
              <dl className="mt-5 grid gap-4 border-t border-pink-soft pt-5">
                {instapay.recipient_name && (
                  <div>
                    <dt className="text-sm font-semibold text-cocoa-muted">Recipient name</dt>
                    <dd className="text-lg font-semibold">{instapay.recipient_name}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-semibold text-cocoa-muted">InstaPay address / number</dt>
                  <dd className="flex flex-wrap items-center justify-between gap-3">
                    <span className="break-all font-display text-xl font-semibold">{instapay.identifier}</span>
                    <CopyButton value={instapay.identifier} label="Copy InstaPay address" />
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="mt-4 rounded-2xl bg-white px-4 py-3 text-[15px]">
                Payment details will be shared with you on WhatsApp shortly.
              </p>
            )}
          </div>
          {configured && (
            <CopyButton
              className="mt-3 w-full justify-center"
              label="Copy all payment details"
              value={`Send ${amount} via InstaPay to ${instapay.identifier}${instapay.recipient_name ? ` (${instapay.recipient_name})` : ""}. Order #${order.order_number}`}
            />
          )}
          <ol className="mt-6 list-decimal space-y-2 pl-5 text-[15px]">
            <li>Open your InstaPay app and send exactly <strong>{amount}</strong>{configured ? " to the address above" : ""}.</li>
            <li>Add <strong>#{order.order_number}</strong> in the transfer note if you can.</li>
            <li>Come back here and tap the button below.</li>
          </ol>
          {instapay.instructions && <p className="mt-4 whitespace-pre-line rounded-2xl bg-cream px-4 py-3 text-[15px]">{instapay.instructions}</p>}
          <div className="mt-6 border-t border-line pt-6">
            <ReportPayment token={token} again={status === "rejected"} />
          </div>
          <p className="mt-4 flex items-start gap-2 text-sm text-cocoa-muted">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /> Your order is confirmed after we check the transfer in our InstaPay account. We never mark a payment as received automatically.
          </p>
        </section>
      )}

      {order.payment_method === "instapay" && status === "reported" && !canceled && (
        <div className="mt-8 flex items-start gap-3 rounded-[24px] bg-warn-tint p-5 text-warn">
          <CircleCheck className="mt-0.5 h-5 w-5 shrink-0" />
          <p>You told us you sent the payment{order.payment?.reference ? ` (reference ${order.payment.reference})` : ""}. Status: <strong>waiting for verification</strong>.</p>
        </div>
      )}

      <section className={`${card} mt-8`} aria-labelledby="sum-title">
        <h2 id="sum-title" className="font-display text-2xl font-semibold">Your order</h2>
        <OrderSummary order={order} />
      </section>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href={`/order/${token}`} className={btn("primary", "lg")}>Track my order <ArrowRight className="h-5 w-5" /></Link>
        {contact.whatsapp && (
          <a href={whatsappLink(contact.whatsapp, customerToShopMessage(order.order_number))} target="_blank" rel="noopener noreferrer" className={btn("secondary", "lg")}>
            <MessageCircle className="h-5 w-5" /> WhatsApp us
          </a>
        )}
      </div>
      <p className="mt-4 text-center text-sm text-cocoa-muted">Bookmark your tracking page. It&apos;s private to you.</p>
    </div>
  );
}
