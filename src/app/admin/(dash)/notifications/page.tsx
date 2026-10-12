import type { Metadata } from "next";
import Link from "next/link";
import { CircleAlert, CircleCheck } from "lucide-react";
import { RetryAllButton, RetryButton, TestButton } from "@/components/admin/notification-actions";
import { Card, PageHeader, Pill } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { SITE_URL } from "@/lib/env";
import { formatDateTime } from "@/lib/format";
import { telegramConfigured } from "@/lib/telegram";

export const metadata: Metadata = { title: "Notifications" };

const EVENT_LABEL: Record<string, string> = { order_created: "New order", payment_reported: "Payment reported", order_canceled: "Order canceled", needs_attention: "Needs attention" };
const eventLabel = (e: string) => (e.startsWith("test_") ? "Test message" : EVENT_LABEL[e.replace(/_\d+$/, "")] ?? e);

export default async function NotificationsPage() {
  const { supabase } = await requireAdmin();
  const configured = telegramConfigured();
  const [{ data: problems }, { data: recent }] = await Promise.all([
    supabase.from("notification_logs").select("id,event,status,attempts,last_error,created_at,order:orders(id,order_number)").in("status", ["failed", "pending", "skipped"]).order("created_at", { ascending: false }).limit(50),
    supabase.from("notification_logs").select("id,event,status,sent_at,created_at,order:orders(id,order_number)").eq("status", "sent").order("created_at", { ascending: false }).limit(15),
  ]);
  type Row = { id: string; event: string; status: string; attempts?: number; last_error?: string | null; created_at: string; sent_at?: string | null; order: { id: string; order_number: string } | null };
  const list = (rows: unknown) => (rows ?? []) as Row[];
  // "pending" only lingers if a send crashed mid-way, so treat it as a problem too.
  const failed = list(problems).filter((r) => r.status === "failed" || r.status === "pending");
  const skipped = list(problems).filter((r) => r.status === "skipped");

  return (
    <div className="space-y-5">
      <PageHeader title="Notifications" description="New orders and payment reports are sent to your private Telegram chat." />
      <Card>
        <div className="flex flex-wrap items-center gap-4">
          {configured ? <CircleCheck className="h-10 w-10 text-good" /> : <CircleAlert className="h-10 w-10 text-warn" />}
          <div className="flex-1">
            <p className="text-lg font-bold">{configured ? "Telegram is connected" : "Telegram isn't connected yet"}</p>
            <p className="text-cocoa-muted">{configured ? "Tap the button to make sure messages reach you." : "Ask whoever set up the website to add TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID (see docs/TELEGRAM_SETUP.md)."}</p>
          </div>
          {configured && <TestButton />}
        </div>
        {configured && !SITE_URL.startsWith("https://") && <p className="mt-4 rounded-xl bg-warn-tint px-3 py-2 text-sm text-warn">The &quot;View Order&quot; button is left out of messages until the website runs on a public https address (NEXT_PUBLIC_SITE_URL).</p>}
      </Card>

      <Card title={`Delivery problems${failed.length ? ` (${failed.length})` : ""}`} action={failed.length > 0 && <RetryAllButton />}>
        {failed.length === 0 ? <p className="text-cocoa-muted">No failed messages.</p> : (
          <ul className="divide-y divide-line">
            {failed.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="flex-1">
                  <p className="font-semibold">{eventLabel(r.event)} {r.order && <Link href={`/admin/orders/${r.order.id}`} className="text-pink-ink hover:underline">#{r.order.order_number}</Link>}</p>
                  <p className="text-sm text-cocoa-muted">{formatDateTime(r.created_at)} · {r.attempts} attempt{r.attempts === 1 ? "" : "s"}</p>
                  {r.last_error && <p className="mt-1 text-sm text-bad">{r.last_error}</p>}
                </div>
                <RetryButton id={r.id} />
              </li>
            ))}
          </ul>
        )}
      </Card>

      {skipped.length > 0 && (
        <Card title="Not sent (Telegram wasn't connected)">
          <p className="mb-3 text-sm text-cocoa-muted">Once Telegram is connected you can send these now.</p>
          <ul className="divide-y divide-line">
            {skipped.slice(0, 10).map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 py-2.5">
                <p className="flex-1 font-semibold">{eventLabel(r.event)} {r.order && <Link href={`/admin/orders/${r.order.id}`} className="text-pink-ink hover:underline">#{r.order.order_number}</Link>} <span className="text-sm font-normal text-cocoa-muted">{formatDateTime(r.created_at)}</span></p>
                {configured && <RetryButton id={r.id} />}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card title="Recently delivered">
        {list(recent).length === 0 ? <p className="text-cocoa-muted">Nothing sent yet.</p> : (
          <ul className="divide-y divide-line">
            {list(recent).map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-2 py-2.5">
                <Pill tone="good">Sent</Pill>
                <span className="font-semibold">{eventLabel(r.event)}</span>
                {r.order && <Link href={`/admin/orders/${r.order.id}`} className="text-pink-ink hover:underline">#{r.order.order_number}</Link>}
                <span className="ml-auto text-sm text-cocoa-muted">{formatDateTime(r.sent_at ?? r.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
