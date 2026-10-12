import { CreditCard } from "lucide-react";
import { FULFILLMENT_ADMIN_LABEL, FULFILLMENT_TONE, PAYMENT_LABEL, PAYMENT_TONE } from "@/lib/status";
import type { FulfillmentStatus, PaymentStatus } from "@/lib/types";

export const TONES = {
  neutral: "bg-cream text-cocoa ring-1 ring-line",
  warn: "bg-warn-tint text-warn",
  good: "bg-good-tint text-good",
  bad: "bg-bad-tint text-bad",
  info: "bg-info-tint text-info",
  pink: "bg-pink-tint text-pink-ink",
} as const;

export function Pill({ tone = "neutral", children, className = "" }: { tone?: keyof typeof TONES; children: React.ReactNode; className?: string }) {
  return <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${TONES[tone]} ${className}`}>{children}</span>;
}

/** Payment pills carry a card icon so they're never confused with order-status pills. */
export function PaymentPill({ status }: { status: PaymentStatus }) {
  return <Pill tone={PAYMENT_TONE[status]}><CreditCard className="h-3.5 w-3.5" />{PAYMENT_LABEL[status].replace("Payment ", "")}</Pill>;
}

export function StatusPill({ status }: { status: FulfillmentStatus }) {
  return <Pill tone={FULFILLMENT_TONE[status]} className="rounded-lg">{FULFILLMENT_ADMIN_LABEL[status]}</Pill>;
}

export function Card({ title, action, children, className = "", id }: { title?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string; id?: string }) {
  return (
    <section id={id} className={`rounded-[20px] bg-white p-5 ring-1 ring-line md:p-6 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          {title && <h2 className="text-lg font-bold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-bold md:text-4xl">{title}</h1>
        {description && <p className="mt-1 text-cocoa-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, text, action }: { icon: React.ComponentType<{ className?: string }>; title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-[20px] border-2 border-dashed border-line px-6 py-12 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-pink-tint text-pink-ink"><Icon className="h-7 w-7" /></span>
      <p className="mt-4 text-lg font-bold">{title}</p>
      {text && <p className="mt-1 max-w-sm text-cocoa-muted">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export const adminInput =
  "w-full rounded-[14px] bg-white px-3.5 py-2.5 text-base text-cocoa ring-1 ring-line placeholder:text-cocoa-muted/70 focus:outline-none focus:ring-2 focus:ring-pink-ink disabled:bg-cream";

export function FieldRow({ label, hint, children, htmlFor }: { label: string; hint?: string; children: React.ReactNode; htmlFor?: string }) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-bold">{label}</label>
      {children}
      {hint && <p className="text-sm text-cocoa-muted">{hint}</p>}
    </div>
  );
}
