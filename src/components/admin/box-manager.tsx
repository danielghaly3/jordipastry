"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Boxes, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteBox, moveBox, saveBox, saveSurcharges } from "@/app/admin/actions/catalog";
import { saveSetting } from "@/app/admin/actions/settings";
import { ConfirmDialog, Toggle } from "@/components/admin/controls";
import { Card, EmptyState, FieldRow, Pill, adminInput } from "@/components/admin/ui";
import { btn } from "@/components/ui/button";
import { formatEGP } from "@/lib/format";
import type { BoxSize, Product } from "@/lib/types";

type Draft = { id?: string; name: string; description: string; slots: string; price: string; is_active: boolean; eligible: string[] };

function BoxEditor({ box, products, index, total, onDone }: { box?: BoxSize; products: Product[]; index: number; total: number; onDone: () => void }) {
  const [d, setD] = useState<Draft>({
    id: box?.id, name: box?.name ?? "", description: box?.description ?? "", slots: String(box?.slots ?? 6), price: box ? String(box.price) : "",
    is_active: box?.is_active ?? true, eligible: box?.eligible ?? products.map((p) => p.id),
  });
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((s) => ({ ...s, [k]: v }));
  const save = async () => {
    setSaving(true);
    const res = await saveBox({ ...d, slots: Number(d.slots), price: Number(d.price) });
    setSaving(false);
    if (!res.ok) return toast.error(res.error);
    toast.success("Box saved");
    onDone();
  };

  return (
    <Card
      title={<span className="flex items-center gap-2">{box ? box.name : "New box size"} {box && !box.is_active && <Pill>Off</Pill>}</span>}
      action={box && (
        <span className="flex">
          <button type="button" disabled={index === 0} onClick={async () => { await moveBox(box.id, -1); onDone(); }} className="grid h-9 w-9 place-items-center rounded-full hover:bg-cream disabled:opacity-30" aria-label="Move up"><ArrowUp className="h-4 w-4" /></button>
          <button type="button" disabled={index === total - 1} onClick={async () => { await moveBox(box.id, 1); onDone(); }} className="grid h-9 w-9 place-items-center rounded-full hover:bg-cream disabled:opacity-30" aria-label="Move down"><ArrowDown className="h-4 w-4" /></button>
          <ConfirmDialog title={`Delete ${box.name}?`} body="Customers won't be able to choose it anymore. Past orders are not affected." confirmLabel="Delete box" tone="danger"
            onConfirm={async () => { const r = await deleteBox(box.id); if (!r.ok) { toast.error(r.error); return false; } toast.success("Box deleted"); onDone(); }}
            trigger={(open) => <button type="button" onClick={open} className="grid h-9 w-9 place-items-center rounded-full hover:bg-bad-tint hover:text-bad" aria-label={`Delete ${box.name}`}><Trash2 className="h-4 w-4" /></button>} />
        </span>
      )}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <FieldRow label="Name" htmlFor={`bn-${d.id ?? "new"}`}><input id={`bn-${d.id ?? "new"}`} className={adminInput} value={d.name} onChange={(e) => set("name", e.target.value)} placeholder="Box of 6" maxLength={60} /></FieldRow>
        <FieldRow label="Number of donuts" htmlFor={`bs-${d.id ?? "new"}`}><input id={`bs-${d.id ?? "new"}`} inputMode="numeric" className={adminInput} value={d.slots} onChange={(e) => set("slots", e.target.value.replace(/\D/g, ""))} /></FieldRow>
        <FieldRow label="Box price (EGP)" htmlFor={`bp-${d.id ?? "new"}`}><input id={`bp-${d.id ?? "new"}`} inputMode="decimal" className={adminInput} value={d.price} onChange={(e) => set("price", e.target.value)} /></FieldRow>
      </div>
      <div className="mt-4"><FieldRow label="Short description (optional)" htmlFor={`bd-${d.id ?? "new"}`}><input id={`bd-${d.id ?? "new"}`} className={adminInput} value={d.description} onChange={(e) => set("description", e.target.value)} maxLength={300} /></FieldRow></div>
      <div className="mt-4"><Toggle checked={d.is_active} onChange={(v) => set("is_active", v)} label="Customers can order this box" /></div>
      <fieldset className="mt-5">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <legend className="text-sm font-bold">Flavors allowed in this box ({d.eligible.length})</legend>
          <span className="flex gap-2 text-sm font-semibold">
            <button type="button" className="text-pink-ink" onClick={() => set("eligible", products.map((p) => p.id))}>Select all</button>
            <button type="button" className="text-cocoa-muted" onClick={() => set("eligible", [])}>Clear</button>
          </span>
        </div>
        <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <label key={p.id} className="flex cursor-pointer items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-cream">
              <input type="checkbox" className="h-5 w-5 accent-[var(--pink-ink)]" checked={d.eligible.includes(p.id)} onChange={(e) => set("eligible", e.target.checked ? [...d.eligible, p.id] : d.eligible.filter((x) => x !== p.id))} />
              <span className="font-semibold">{p.name}</span>
              {p.box_surcharge > 0 && <span className="text-xs text-accent-ink">+{formatEGP(p.box_surcharge)}</span>}
            </label>
          ))}
        </div>
      </fieldset>
      <button type="button" onClick={save} disabled={saving} className={btn("primary", "md", "mt-5")}>{saving && <Loader2 className="h-4 w-4 animate-spin" />} Save box</button>
    </Card>
  );
}

export function BoxManager({ boxes, products, enabled }: { boxes: BoxSize[]; products: Product[]; enabled: boolean }) {
  const router = useRouter();
  const [, start] = useTransition();
  const [adding, setAdding] = useState(false);
  const [on, setOn] = useState(enabled);
  const [sur, setSur] = useState<Record<string, string>>(Object.fromEntries(products.map((p) => [p.id, String(p.box_surcharge)])));
  const refresh = () => start(() => router.refresh());

  return (
    <div className="space-y-5">
      <div className={`rounded-[20px] p-5 ring-1 ${on ? "bg-good-tint ring-good/20" : "bg-cream ring-line"}`}>
        <Toggle checked={on} label="Custom boxes on the website" description={on ? "Customers can build their own boxes." : "The Build a Box page shows a 'taking a break' message."}
          onChange={async (v) => { setOn(v); const r = await saveSetting("store", { custom_boxes_enabled: v }); if (!r.ok) { setOn(!v); toast.error(r.error); } else toast.success(v ? "Boxes are on" : "Boxes are off"); }} />
      </div>

      {boxes.length === 0 && !adding && <EmptyState icon={Boxes} title="No box sizes yet" text="Add sizes like Box of 3, 6 or 12 with their prices." />}
      {boxes.map((b, i) => <BoxEditor key={b.id + b.name + b.price + b.slots + b.eligible.length} box={b} products={products} index={i} total={boxes.length} onDone={refresh} />)}
      {adding ? <BoxEditor products={products} index={0} total={0} onDone={() => { setAdding(false); refresh(); }} /> : (
        <button type="button" onClick={() => setAdding(true)} className={btn("secondary", "md")}><Plus className="h-4 w-4" /> Add box size</button>
      )}

      <Card title="Premium flavor surcharges">
        <p className="mb-4 text-sm text-cocoa-muted">Extra charged for each donut of that flavor inside a custom box. Use 0 for no extra.</p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {products.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 rounded-xl bg-cream px-3 py-2">
              <label htmlFor={`sur-${p.id}`} className="font-semibold">{p.name}</label>
              <span className="relative w-28">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-cocoa-muted">+EGP</span>
                <input id={`sur-${p.id}`} inputMode="decimal" className={`${adminInput} pl-12`} value={sur[p.id]} onChange={(e) => setSur((s) => ({ ...s, [p.id]: e.target.value }))} />
              </span>
            </li>
          ))}
        </ul>
        <button type="button" className={btn("primary", "md", "mt-4")} onClick={async () => {
          const r = await saveSurcharges(products.map((p) => ({ id: p.id, box_surcharge: Number(sur[p.id]) || 0 })));
          if (!r.ok) return toast.error(r.error);
          toast.success("Surcharges saved");
          refresh();
        }}>Save surcharges</button>
      </Card>
    </div>
  );
}
