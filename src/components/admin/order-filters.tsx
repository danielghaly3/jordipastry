"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ChevronDown, Download, Search } from "lucide-react";
import { adminInput } from "@/components/admin/ui";
import { btn } from "@/components/ui/button";
import { FULFILLMENT_ADMIN_LABEL, PAYMENT_LABEL } from "@/lib/status";

export function OrderFilters() {
  const router = useRouter();
  const path = usePathname();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const set = (key: string, value: string) => {
    const next = new URLSearchParams(sp);
    if (value) next.set(key, value); else next.delete(key);
    next.delete("page");
    router.replace(`${path}?${next}`);
  };
  const view = sp.get("view") ?? "";
  const chip = (on: boolean) => `h-10 rounded-full px-4 text-sm font-bold ${on ? "bg-cocoa text-cream" : "bg-white ring-1 ring-line hover:bg-cream"}`;

  return (
    <div className="mb-5 space-y-3">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Quick views">
        {[["", "All orders"], ["action", "Needs action"], ["active", "In progress"]].map(([v, l]) => (
          <button key={v} type="button" className={chip(view === v)} aria-pressed={view === v} onClick={() => set("view", v)}>{l}</button>
        ))}
      </div>
      <form className="relative" onSubmit={(e) => { e.preventDefault(); set("q", q.trim()); }}>
          <label htmlFor="order-search" className="sr-only">Search orders</label>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-cocoa-muted" />
          <input id="order-search" type="search" className={`${adminInput} pl-11`} placeholder="Order #, name or phone" value={q} onChange={(e) => setQ(e.target.value)} onBlur={() => q !== (sp.get("q") ?? "") && set("q", q.trim())} />
      </form>
      <details className="group rounded-[16px] bg-white ring-1 ring-line" open={Boolean(sp.get("payment") || sp.get("status") || sp.get("from") || sp.get("to")) || undefined}>
        <summary className="flex h-11 cursor-pointer list-none items-center justify-between px-4 text-sm font-bold">More filters & export <ChevronDown className="h-4 w-4 text-cocoa-muted transition group-open:rotate-180" /></summary>
        <div className="grid gap-2 px-3 pb-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_auto_auto] lg:items-end">
        <select aria-label="Payment status" className={adminInput} value={sp.get("payment") ?? ""} onChange={(e) => set("payment", e.target.value)}>
          <option value="">Any payment</option>
          {Object.entries(PAYMENT_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <select aria-label="Order status" className={adminInput} value={sp.get("status") ?? ""} onChange={(e) => set("status", e.target.value)}>
          <option value="">Any status</option>
          {Object.entries(FULFILLMENT_ADMIN_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <label className="grid gap-1 text-xs font-bold text-cocoa-muted">From<input type="date" className={adminInput} value={sp.get("from") ?? ""} onChange={(e) => set("from", e.target.value)} /></label>
        <label className="grid gap-1 text-xs font-bold text-cocoa-muted">To<input type="date" className={adminInput} value={sp.get("to") ?? ""} onChange={(e) => set("to", e.target.value)} /></label>
        <a href={`/admin/orders-export?${sp}`} className={btn("secondary", "md")}><Download className="h-4 w-4" /> Export CSV</a>
        </div>
      </details>
    </div>
  );
}
