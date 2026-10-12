"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Bike, CreditCard, Loader2, Lock, Store, Banknote } from "lucide-react";
import { toast } from "sonner";
import { placeOrder, quoteOrder } from "@/app/(store)/checkout/actions";
import { Mascot } from "@/components/brand/mascot";
import { Field, inputClass } from "@/components/checkout/field";
import { CartLines } from "@/components/store/cart-lines";
import { btn } from "@/components/ui/button";
import { cart, toOrderItems, useCart } from "@/lib/cart/store";
import type { Quote } from "@/lib/checkout-schema";
import { formatEGP } from "@/lib/format";
import { normalizeEgyptPhone, normalizeWhatsApp } from "@/lib/phone";
import type { PublicSettings } from "@/lib/settings";
import type { DeliveryArea } from "@/lib/types";

const KEY = "jordi-checkout-key";

function idempotencyKey() {
  try {
    const existing = sessionStorage.getItem(KEY);
    if (existing) return existing;
    const k = crypto.randomUUID();
    sessionStorage.setItem(KEY, k);
    return k;
  } catch {
    return crypto.randomUUID();
  }
}

export function CheckoutForm({ store, areas, slots }: { store: PublicSettings["store"]; areas: DeliveryArea[]; slots: { date: string; times: string[] }[] }) {
  const router = useRouter();
  const { items, subtotal: estimate } = useCart();
  const deliveryOk = store.delivery_enabled && areas.length > 0;
  const methods = [deliveryOk && "delivery", store.pickup_enabled && "pickup"].filter(Boolean) as ("delivery" | "pickup")[];
  const payments = [store.instapay_enabled && "instapay", store.cash_enabled && "cash"].filter(Boolean) as ("instapay" | "cash")[];

  const [f, setF] = useState({
    name: "", phone: "", whatsapp: "", differentWhatsapp: false,
    fulfillment_method: methods[0] ?? "pickup", delivery_area_id: "", delivery_address: "",
    requested_date: "", requested_time: "", notes: "", payment_method: payments[0] ?? "instapay", website: "",
  });
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteError, setQuoteError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const orderItems = useMemo(() => toOrderItems(items), [items]);
  const areaId = f.fulfillment_method === "delivery" ? f.delivery_area_id || null : null;

  useEffect(() => {
    if (orderItems.length === 0) return;
    let live = true;
    const t = setTimeout(async () => {
      const res = await quoteOrder({ items: orderItems, fulfillment_method: f.fulfillment_method, delivery_area_id: areaId, payment_method: f.payment_method });
      if (!live) return;
      if (res.ok) { setQuote(res.data); setQuoteError(""); } else { setQuote(null); setQuoteError(res.error); }
    }, 250);
    return () => { live = false; clearTimeout(t); };
  }, [orderItems, f.fulfillment_method, areaId, f.payment_method]);

  const phoneError = touched.phone && !normalizeEgyptPhone(f.phone) ? "Enter an Egyptian mobile number, like 010 1234 5678." : "";
  const waError = f.differentWhatsapp && touched.whatsapp && f.whatsapp && !normalizeWhatsApp(f.whatsapp) ? "Enter a full WhatsApp number (Egyptian, or international starting with +)." : "";
  const nameError = touched.name && f.name.trim().length < 2 ? "Please enter your name." : "";
  const addressError = touched.delivery_address && f.fulfillment_method === "delivery" && f.delivery_address.trim().length < 5 ? "Please add your street, building and floor." : "";
  const times = slots.find((d) => d.date === f.requested_date)?.times ?? [];
  const minOrder = store.min_order_amount;
  const subtotal = quote?.subtotal ?? estimate;
  const belowMin = minOrder > 0 && subtotal < minOrder;

  if (items.length === 0 && !submitted) {
    return (
      <div className="mt-10 rounded-[28px] bg-white p-10 text-center shadow-cloud">
        <p className="font-display text-2xl font-semibold">Your cart is empty</p>
        <p className="mt-2 text-cocoa-muted">Add a few treats first, then come back here.</p>
        <Link href="/menu" className={btn("primary", "md", "mt-6")}>Browse the menu</Link>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, phone: true, whatsapp: true, delivery_address: true });
    if (submitting) return;
    setError("");
    setSubmitting(true);
    const res = await placeOrder({
      ...f,
      whatsapp: f.differentWhatsapp ? f.whatsapp : "",
      delivery_area_id: areaId,
      items: orderItems,
      idempotency_key: idempotencyKey(),
    });
    if (res.ok) {
      setSubmitted(true);
      try { sessionStorage.removeItem(KEY); } catch {}
      cart.clear();
      router.push(`/checkout/payment/${res.data.token}?new=1`);
      return;
    }
    setSubmitting(false);
    setError(res.error);
    toast.error(res.error);
  };

  const card = "rounded-[28px] bg-white p-5 shadow-cloud md:p-7";
  const option = (on: boolean) => `flex cursor-pointer items-center gap-3 rounded-[20px] p-4 ring-2 transition ${on ? "bg-pink-tint ring-pink-ink" : "bg-white ring-line hover:ring-pink-soft"}`;

  if (!store.accepting_orders) {
    return (
      <div className="mt-10 rounded-[28px] bg-white p-10 text-center shadow-cloud">
        <Mascot pose="sleeping" className="mx-auto h-40 w-40 md:h-[200px] md:w-[200px]" />
        <p className="font-display text-2xl font-semibold">We&apos;re not taking orders right now</p>
        <p className="mt-2 text-cocoa-muted">{store.closure_message}</p>
        <p className="mt-4 text-sm text-cocoa-muted">Your cart is saved for when we&apos;re back.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="mt-8 grid gap-8 lg:grid-cols-[1fr_400px] lg:items-start">
      <div className="space-y-5">
        <section className={card} aria-labelledby="you">
          <h2 id="you" className="font-display text-2xl font-semibold">Your details</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field id="name" label="Name" error={nameError}>
              <input id="name" autoComplete="name" className={inputClass} value={f.name} onChange={(e) => set("name", e.target.value)} onBlur={() => setTouched((t) => ({ ...t, name: true }))} aria-invalid={!!nameError} aria-describedby={nameError ? "name-error" : undefined} required maxLength={80} />
            </Field>
            <Field id="phone" label="Mobile number" hint="We'll use this to confirm your order." error={phoneError}>
              <input id="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="010 1234 5678" className={inputClass} value={f.phone} onChange={(e) => set("phone", e.target.value)} onBlur={() => setTouched((t) => ({ ...t, phone: true }))} aria-invalid={!!phoneError} aria-describedby={phoneError ? "phone-error" : "phone-hint"} required maxLength={30} />
            </Field>
          </div>
          <label className="mt-4 flex cursor-pointer items-center gap-3 text-[15px]">
            <input type="checkbox" className="h-5 w-5 accent-[var(--pink-ink)]" checked={f.differentWhatsapp} onChange={(e) => set("differentWhatsapp", e.target.checked)} />
            My WhatsApp number is different
          </label>
          {f.differentWhatsapp && (
            <div className="mt-3 sm:max-w-[calc(50%-8px)]">
              <Field id="whatsapp" label="WhatsApp number" error={waError}>
                <input id="whatsapp" type="tel" inputMode="tel" placeholder="010 1234 5678 or +971..." className={inputClass} value={f.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} onBlur={() => setTouched((t) => ({ ...t, whatsapp: true }))} aria-invalid={!!waError} maxLength={30} />
              </Field>
            </div>
          )}
        </section>

        <section className={card} aria-labelledby="how">
          <h2 id="how" className="font-display text-2xl font-semibold">Delivery or pickup</h2>
          {methods.length === 0 ? (
            <p className="mt-3 text-bad">Delivery and pickup are both unavailable right now.</p>
          ) : (
            <div className="mt-5 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Delivery or pickup">
              {methods.map((m) => (
                <label key={m} className={option(f.fulfillment_method === m)}>
                  <input type="radio" name="method" className="sr-only" checked={f.fulfillment_method === m} onChange={() => set("fulfillment_method", m)} />
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-white text-pink-ink ring-1 ring-line">{m === "delivery" ? <Bike className="h-5 w-5" /> : <Store className="h-5 w-5" />}</span>
                  <span>
                    <span className="block font-semibold">{m === "delivery" ? "Delivery" : "Pickup"}</span>
                    <span className="block text-sm text-cocoa-muted">{m === "delivery" ? "Fee depends on your area" : "Free. Details after ordering"}</span>
                  </span>
                </label>
              ))}
            </div>
          )}
          {f.fulfillment_method === "delivery" && (
            <div className="mt-5 grid gap-4">
              <Field id="area" label="Delivery area">
                <select id="area" className={inputClass} value={f.delivery_area_id} onChange={(e) => set("delivery_area_id", e.target.value)} required>
                  <option value="">Choose your area</option>
                  {areas.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.fee > 0 ? formatEGP(a.fee) : "free"})</option>)}
                </select>
              </Field>
              <Field id="address" label="Address" hint="Street, building, floor and apartment. Add a landmark if it helps." error={addressError}>
                <textarea id="address" rows={3} autoComplete="street-address" className={inputClass} value={f.delivery_address} onChange={(e) => set("delivery_address", e.target.value)} onBlur={() => setTouched((t) => ({ ...t, delivery_address: true }))} aria-invalid={!!addressError} maxLength={300} />
              </Field>
            </div>
          )}
        </section>

        {slots.length > 0 && (
          <section className={card} aria-labelledby="when">
            <h2 id="when" className="font-display text-2xl font-semibold">When?</h2>
            <p className="mt-1 text-sm text-cocoa-muted">Optional. Leave empty for as soon as possible{store.prep_time_text ? ` (${store.prep_time_text})` : ""}.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field id="date" label="Day">
                <select id="date" className={inputClass} value={f.requested_date} onChange={(e) => setF((s) => ({ ...s, requested_date: e.target.value, requested_time: "" }))}>
                  <option value="">As soon as possible</option>
                  {slots.map((d) => <option key={d.date} value={d.date}>{d.date}</option>)}
                </select>
              </Field>
              <Field id="time" label="Time (Cairo)">
                <select id="time" className={inputClass} value={f.requested_time} onChange={(e) => set("requested_time", e.target.value)} disabled={!f.requested_date}>
                  <option value="">Choose a time</option>
                  {times.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
            </div>
          </section>
        )}

        <section className={card} aria-labelledby="pay">
          <h2 id="pay" className="font-display text-2xl font-semibold">Payment</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Payment method">
            {payments.map((p) => (
              <label key={p} className={option(f.payment_method === p)}>
                <input type="radio" name="payment" className="sr-only" checked={f.payment_method === p} onChange={() => set("payment_method", p)} />
                <span className="grid h-11 w-11 place-items-center rounded-full bg-white text-pink-ink ring-1 ring-line">{p === "instapay" ? <CreditCard className="h-5 w-5" /> : <Banknote className="h-5 w-5" />}</span>
                <span>
                  <span className="block font-semibold">{p === "instapay" ? "InstaPay" : "Cash"}</span>
                  <span className="block text-sm text-cocoa-muted">{p === "instapay" ? "Transfer details on the next step" : f.fulfillment_method === "pickup" ? "Pay when you pick up" : "Pay on delivery"}</span>
                </span>
              </label>
            ))}
          </div>
        </section>

        <section className={card} aria-labelledby="notes-h">
          <h2 id="notes-h" className="font-display text-2xl font-semibold">Anything else?</h2>
          <div className="mt-4">
            <Field id="notes" label="Notes (optional)" hint="Allergies, a birthday message, gate code...">
              <textarea id="notes" rows={3} className={inputClass} value={f.notes} onChange={(e) => set("notes", e.target.value)} maxLength={500} />
            </Field>
          </div>
          {/* Honeypot for bots: hidden from people and screen readers */}
          <input type="text" name="website" tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => set("website", e.target.value)} className="absolute -left-[9999px] h-px w-px opacity-0" aria-hidden="true" />
        </section>
      </div>

      <aside className="lg:sticky lg:top-28" aria-labelledby="summary">
        <div className="rounded-[28px] bg-white p-5 shadow-lift md:p-7">
          <h2 id="summary" className="font-display text-2xl font-semibold">Order summary</h2>
          <CartLines items={items} />
          <dl className="space-y-2 border-t border-line pt-4 text-[15px]">
            <div className="flex justify-between"><dt className="text-cocoa-muted">Subtotal</dt><dd>{formatEGP(subtotal)}</dd></div>
            <div className="flex justify-between">
              <dt className="text-cocoa-muted">Delivery fee</dt>
              <dd>{f.fulfillment_method === "pickup" ? "Free (pickup)" : areaId ? formatEGP(quote?.delivery_fee ?? 0) : "Choose an area"}</dd>
            </div>
            <div className="flex items-baseline justify-between pt-1"><dt className="font-semibold">Total</dt><dd className="font-display text-3xl font-bold">{formatEGP(quote?.total ?? estimate)}</dd></div>
            <div className="flex justify-between text-sm"><dt className="text-cocoa-muted">Payment</dt><dd>{f.payment_method === "instapay" ? "InstaPay" : "Cash"}</dd></div>
          </dl>
          {quoteError && <p className="mt-4 rounded-2xl bg-bad-tint px-4 py-3 text-sm font-semibold text-bad" role="alert">{quoteError}</p>}
          {belowMin && <p className="mt-4 rounded-2xl bg-warn-tint px-4 py-3 text-sm font-semibold text-warn">The minimum order is {formatEGP(minOrder)}. Add {formatEGP(minOrder - subtotal)} more.</p>}
          {error && <p className="mt-4 rounded-2xl bg-bad-tint px-4 py-3 text-sm font-semibold text-bad" role="alert">{error}</p>}
          <button type="submit" disabled={submitting || !!quoteError || belowMin || methods.length === 0} className={btn("primary", "lg", "mt-5 hidden w-full lg:inline-flex")}>
            {submitting ? <><Loader2 className="h-5 w-5 animate-spin" /> Placing order...</> : <><Lock className="h-4 w-4" /> Place order</>}
          </button>
          <p className="mt-3 text-center text-xs text-cocoa-muted">By ordering you agree to our <Link href="/terms" className="underline">terms</Link> and <Link href="/privacy" className="underline">privacy policy</Link>.</p>
        </div>
      </aside>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 p-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        <button type="submit" disabled={submitting || !!quoteError || belowMin || methods.length === 0} className={btn("primary", "lg", "w-full")}>
          {submitting ? <><Loader2 className="h-5 w-5 animate-spin" /> Placing order...</> : <>Place order · {formatEGP(quote?.total ?? estimate)}</>}
        </button>
      </div>
    </form>
  );
}
