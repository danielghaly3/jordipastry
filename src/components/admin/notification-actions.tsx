"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, RefreshCw, Send } from "lucide-react";
import { toast } from "sonner";
import { retryAlert, retryAllAlerts, testTelegram } from "@/app/admin/actions/settings";
import { btn } from "@/components/ui/button";

function useBusy() {
  const [busy, setBusy] = useState(false);
  return { busy, run: async (fn: () => Promise<void>) => { setBusy(true); try { await fn(); } finally { setBusy(false); } } };
}

export function TestButton() {
  const router = useRouter();
  const { busy, run } = useBusy();
  return (
    <button type="button" disabled={busy} className={btn("primary", "md")} onClick={() => run(async () => {
      const r = await testTelegram();
      if (r.ok) toast.success("Sent! Check your Telegram."); else toast.error(r.error);
      router.refresh();
    })}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send Test Notification</button>
  );
}

export function RetryButton({ id }: { id: string }) {
  const router = useRouter();
  const { busy, run } = useBusy();
  return (
    <button type="button" disabled={busy} className={btn("secondary", "sm")} onClick={() => run(async () => {
      const r = await retryAlert(id);
      if (r.ok) toast.success("Delivered"); else toast.error(r.error);
      router.refresh();
    })}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Retry</button>
  );
}

export function RetryAllButton() {
  const router = useRouter();
  const { busy, run } = useBusy();
  return (
    <button type="button" disabled={busy} className={btn("secondary", "sm")} onClick={() => run(async () => {
      const r = await retryAllAlerts();
      if (r.ok) toast[r.data.failed ? "warning" : "success"](`${r.data.sent} delivered${r.data.failed ? `, ${r.data.failed} still failing` : ""}`); else toast.error(r.error);
      router.refresh();
    })}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Retry all</button>
  );
}
