"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowDown, ArrowUp, Loader2, MapPin, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteArea, moveArea, saveArea } from "@/app/admin/actions/catalog";
import { ConfirmDialog, Toggle } from "@/components/admin/controls";
import { useSettingForm } from "@/components/admin/settings-kit";
import { Card, EmptyState, FieldRow, adminInput } from "@/components/admin/ui";
import { btn } from "@/components/ui/button";
import type { PublicSettings, SettingsValue } from "@/lib/settings";
import type { DeliveryArea } from "@/lib/types";

type Store = PublicSettings["store"];

function SaveButton({ dirty, saving, onSave }: { dirty: boolean; saving: boolean; onSave: () => void }) {
  return (
    <div className="mt-5 flex items-center justify-end gap-3 border-t border-line pt-4">
      {dirty && <span className="mr-auto text-sm font-semibold text-warn">Unsaved changes</span>}
      <button type="button" onClick={onSave} disabled={!dirty || saving} className={btn("primary", "md")}>{saving && <Loader2 className="h-4 w-4 animate-spin" />} Save</button>
    </div>
  );
}

export function GeneralSettings({ store, storeName }: { store: Store; storeName: string }) {
  const s = useSettingForm("store", { accepting_orders: store.accepting_orders, closure_message: store.closure_message, prep_time_text: store.prep_time_text });
  const b = useSettingForm("branding", { store_name: storeName });
  return (
    <Card title="General" id="general">
      <div className="grid gap-4">
        <FieldRow label="Store name" htmlFor="g-name">
          <div className="flex gap-2">
            <input id="g-name" className={adminInput} value={b.values.store_name} maxLength={60} onChange={(e) => b.set("store_name", e.target.value)} />
            <button type="button" className={btn("secondary", "md")} disabled={!b.dirty || b.saving} onClick={() => b.save()}>Save</button>
          </div>
        </FieldRow>
        <div className={`rounded-[16px] p-4 ${s.values.accepting_orders ? "bg-good-tint" : "bg-bad-tint"}`}>
          <Toggle checked={s.values.accepting_orders} onChange={(v) => s.set("accepting_orders", v)} label="Accepting orders" description="Switch off to close orders temporarily (holidays, sold out for the day)." />
        </div>
        <FieldRow label="Message while closed" htmlFor="g-closed" hint="Shown at the top of the website and at checkout when orders are off.">
          <textarea id="g-closed" rows={2} className={adminInput} maxLength={200} value={s.values.closure_message} onChange={(e) => s.set("closure_message", e.target.value)} />
        </FieldRow>
        <FieldRow label="Usual preparation time (optional)" htmlFor="g-prep" hint='Shown to customers, e.g. "Ready in about 1 hour".'>
          <input id="g-prep" className={adminInput} maxLength={80} value={s.values.prep_time_text} onChange={(e) => s.set("prep_time_text", e.target.value)} />
        </FieldRow>
      </div>
      <SaveButton dirty={s.dirty} saving={s.saving} onSave={() => s.save()} />
      <p className="mt-3 text-sm text-cocoa-muted">Phone, WhatsApp and store hours are in <Link href="/admin/website?tab=footer" className="font-semibold text-pink-ink underline">Website Editor → Footer & contact</Link>.</p>
    </Card>
  );
}

export function PaymentSettings({ store, instapay }: { store: Store; instapay: SettingsValue<"instapay"> }) {
  const s = useSettingForm("store", { instapay_enabled: store.instapay_enabled, cash_enabled: store.cash_enabled });
  const i = useSettingForm("instapay", instapay);
  const noneOn = !s.values.instapay_enabled && !s.values.cash_enabled;
  return (
    <Card title="Payment" id="payment">
      <div className="grid gap-4">
        <Toggle checked={s.values.instapay_enabled} onChange={(v) => s.set("instapay_enabled", v)} label="InstaPay" description="Customers transfer, then you confirm in the dashboard." />
        <Toggle checked={s.values.cash_enabled} onChange={(v) => s.set("cash_enabled", v)} label="Cash on delivery / pickup" />
        {noneOn && <p className="rounded-xl bg-bad-tint px-3 py-2 text-sm font-semibold text-bad">Turn on at least one payment method, or customers can&apos;t check out.</p>}
      </div>
      <SaveButton dirty={s.dirty} saving={s.saving} onSave={() => s.save()} />

      <div className="mt-6 grid gap-4 border-t border-line pt-6">
        <p className="font-bold">InstaPay details shown to customers</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldRow label="Recipient name" htmlFor="i-name" hint="As it appears in InstaPay."><input id="i-name" className={adminInput} maxLength={80} value={i.values.recipient_name} onChange={(e) => i.set("recipient_name", e.target.value)} /></FieldRow>
          <FieldRow label="InstaPay address or number" htmlFor="i-id" hint="e.g. jordi@instapay or your mobile number."><input id="i-id" className={adminInput} maxLength={80} value={i.values.identifier} onChange={(e) => i.set("identifier", e.target.value)} /></FieldRow>
        </div>
        <FieldRow label="Extra instructions (optional)" htmlFor="i-ins"><textarea id="i-ins" rows={3} className={adminInput} maxLength={500} value={i.values.instructions} onChange={(e) => i.set("instructions", e.target.value)} placeholder="e.g. Please send the exact amount and keep your receipt." /></FieldRow>
        <p className="text-sm text-cocoa-muted">These details only appear on a customer&apos;s own payment page after they place an order.</p>
      </div>
      <SaveButton dirty={i.dirty} saving={i.saving} onSave={() => i.save()} />
    </Card>
  );
}

function AreaRow({ area, index, total, onDone }: { area: DeliveryArea; index: number; total: number; onDone: () => void }) {
  const [name, setName] = useState(area.name);
  const [fee, setFee] = useState(String(area.fee));
  const dirty = name !== area.name || fee !== String(area.fee);
  const save = async (patch: Partial<{ is_active: boolean }> = {}) => {
    const r = await saveArea({ id: area.id, name, fee: Number(fee) || 0, is_active: area.is_active, ...patch });
    if (!r.ok) return toast.error(r.error);
    toast.success("Area saved");
    onDone();
  };
  return (
    <li className="grid grid-cols-[1fr_110px] gap-2 rounded-[16px] bg-cream p-3 sm:grid-cols-[1fr_120px_auto_auto]">
      <input aria-label="Area name" className={adminInput} value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
      <label className="relative"><span className="sr-only">Delivery fee</span><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-cocoa-muted">EGP</span><input inputMode="decimal" className={`${adminInput} pl-11`} value={fee} onChange={(e) => setFee(e.target.value)} /></label>
      <button type="button" aria-pressed={area.is_active} onClick={() => save({ is_active: !area.is_active })} className={`h-10 rounded-full px-3 text-xs font-bold ${area.is_active ? "bg-good-tint text-good" : "bg-white text-cocoa-muted ring-1 ring-line"}`}>{area.is_active ? "Delivering" : "Paused"}</button>
      <span className="flex items-center justify-end">
        {dirty && <button type="button" onClick={() => save()} className={btn("primary", "sm", "mr-1")}>Save</button>}
        <button type="button" disabled={index === 0} onClick={async () => { await moveArea(area.id, -1); onDone(); }} className="grid h-9 w-9 place-items-center rounded-full hover:bg-white disabled:opacity-30" aria-label="Move up"><ArrowUp className="h-4 w-4" /></button>
        <button type="button" disabled={index === total - 1} onClick={async () => { await moveArea(area.id, 1); onDone(); }} className="grid h-9 w-9 place-items-center rounded-full hover:bg-white disabled:opacity-30" aria-label="Move down"><ArrowDown className="h-4 w-4" /></button>
        <ConfirmDialog title={`Delete ${area.name}?`} body="Past orders keep the area name. Customers won't see it anymore." confirmLabel="Delete area" tone="danger"
          onConfirm={async () => { const r = await deleteArea(area.id); if (!r.ok) { toast.error(r.error); return false; } onDone(); }}
          trigger={(o) => <button type="button" onClick={o} className="grid h-9 w-9 place-items-center rounded-full hover:bg-bad-tint hover:text-bad" aria-label={`Delete ${area.name}`}><Trash2 className="h-4 w-4" /></button>} />
      </span>
    </li>
  );
}

export function DeliverySettings({ store, areas, pickup }: { store: Store; areas: DeliveryArea[]; pickup: SettingsValue<"pickup"> }) {
  const router = useRouter();
  const s = useSettingForm("store", {
    delivery_enabled: store.delivery_enabled, pickup_enabled: store.pickup_enabled, min_order_amount: store.min_order_amount,
    scheduling_enabled: store.scheduling_enabled, schedule_days_ahead: store.schedule_days_ahead, schedule_start: store.schedule_start, schedule_end: store.schedule_end,
  });
  const p = useSettingForm("pickup", pickup);
  const [newArea, setNewArea] = useState({ name: "", fee: "" });
  return (
    <Card title="Delivery & pickup" id="delivery">
      <div className="grid gap-4">
        <Toggle checked={s.values.delivery_enabled} onChange={(v) => s.set("delivery_enabled", v)} label="Delivery" description="Customers choose an area below and pay its fee." />
        <Toggle checked={s.values.pickup_enabled} onChange={(v) => s.set("pickup_enabled", v)} label="Pickup" description="Free. No delivery fee is charged." />
        <FieldRow label="Minimum order (EGP)" htmlFor="d-min" hint="0 = no minimum. Delivery fee is not counted."><input id="d-min" inputMode="decimal" className={adminInput} value={String(s.values.min_order_amount)} onChange={(e) => s.set("min_order_amount", Number(e.target.value.replace(/[^\d.]/g, "")) || 0)} /></FieldRow>
        <div className="rounded-[16px] bg-cream p-4">
          <Toggle checked={s.values.scheduling_enabled} onChange={(v) => s.set("scheduling_enabled", v)} label="Let customers pick a day & time" description="Otherwise orders are as soon as possible." />
          {s.values.scheduling_enabled && (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <FieldRow label="Days ahead" htmlFor="d-days"><input id="d-days" type="number" min={0} max={14} className={adminInput} value={s.values.schedule_days_ahead} onChange={(e) => s.set("schedule_days_ahead", Math.min(14, Math.max(0, Number(e.target.value) || 0)))} /></FieldRow>
              <FieldRow label="First time slot" htmlFor="d-start"><input id="d-start" type="time" step={1800} className={adminInput} value={s.values.schedule_start} onChange={(e) => s.set("schedule_start", e.target.value)} /></FieldRow>
              <FieldRow label="Last time slot" htmlFor="d-end"><input id="d-end" type="time" step={1800} className={adminInput} value={s.values.schedule_end} onChange={(e) => s.set("schedule_end", e.target.value)} /></FieldRow>
            </div>
          )}
        </div>
      </div>
      <SaveButton dirty={s.dirty} saving={s.saving} onSave={() => s.save()} />

      <div className="mt-6 border-t border-line pt-6">
        <p className="mb-3 font-bold">Delivery areas & fees</p>
        {areas.length === 0 ? <EmptyState icon={MapPin} title="No delivery areas" text="Add the areas you deliver to. Without any, customers can only choose pickup." /> : (
          <ul className="grid gap-2">{areas.map((a, i) => <AreaRow key={a.id + a.name + a.fee + a.is_active} area={a} index={i} total={areas.length} onDone={() => router.refresh()} />)}</ul>
        )}
        <form className="mt-3 grid grid-cols-[1fr_110px] gap-2 sm:grid-cols-[1fr_120px_auto]" onSubmit={async (e) => {
          e.preventDefault();
          const r = await saveArea({ name: newArea.name, fee: Number(newArea.fee) || 0, is_active: true });
          if (!r.ok) return toast.error(r.error);
          toast.success("Area added");
          setNewArea({ name: "", fee: "" });
          router.refresh();
        }}>
          <input aria-label="New area name" className={adminInput} placeholder="New area, e.g. Nasr City" value={newArea.name} maxLength={80} onChange={(e) => setNewArea((a) => ({ ...a, name: e.target.value }))} />
          <label className="relative"><span className="sr-only">Fee</span><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-cocoa-muted">EGP</span><input inputMode="decimal" className={`${adminInput} pl-11`} value={newArea.fee} onChange={(e) => setNewArea((a) => ({ ...a, fee: e.target.value }))} /></label>
          <button type="submit" disabled={!newArea.name.trim()} className={btn("secondary", "md", "col-span-2 sm:col-span-1")}><Plus className="h-4 w-4" /> Add area</button>
        </form>
      </div>

      <div className="mt-6 border-t border-line pt-6">
        <FieldRow label="Pickup instructions" htmlFor="d-pickup" hint="Only shown on a customer's private order page, never publicly. e.g. address and when to come.">
          <textarea id="d-pickup" rows={3} className={adminInput} maxLength={500} value={p.values.instructions} onChange={(e) => p.set("instructions", e.target.value)} />
        </FieldRow>
        <SaveButton dirty={p.dirty} saving={p.saving} onSave={() => p.save()} />
      </div>
    </Card>
  );
}

export function InventorySettings({ store }: { store: Store }) {
  const s = useSettingForm("store", { daily_order_capacity: store.daily_order_capacity, attention_after_hours: store.attention_after_hours, auto_cancel_unpaid_hours: store.auto_cancel_unpaid_hours });
  return (
    <Card title="Inventory & capacity" id="inventory">
      <div className="grid gap-4">
        <p className="text-sm text-cocoa-muted">Mark donuts sold out or set how many are left from <Link href="/admin/products" className="font-semibold text-pink-ink underline">Products</Link>.</p>
        <Toggle checked={s.values.daily_order_capacity !== null} onChange={(v) => s.set("daily_order_capacity", v ? 20 : null)} label="Limit orders per day" description="Stops new orders for a day once the limit is reached." />
        {s.values.daily_order_capacity !== null && (
          <FieldRow label="Maximum orders per day" htmlFor="i-cap"><input id="i-cap" inputMode="numeric" className={adminInput} value={String(s.values.daily_order_capacity)} onChange={(e) => s.set("daily_order_capacity", Math.max(1, Number(e.target.value.replace(/\D/g, "")) || 1))} /></FieldRow>
        )}
        <FieldRow label="Remind me about unpaid orders after (hours)" htmlFor="i-att" hint="Sends a Telegram reminder for orders still waiting for payment or for your check.">
          <input id="i-att" type="number" min={1} max={72} className={adminInput} value={s.values.attention_after_hours} onChange={(e) => s.set("attention_after_hours", Math.min(72, Math.max(1, Number(e.target.value) || 1)))} />
        </FieldRow>
        <FieldRow label="Cancel unpaid InstaPay orders after (hours)" htmlFor="i-auto" hint="Frees their stock and daily capacity. Orders where the customer reported paying are never canceled automatically. 0 = never.">
          <input id="i-auto" type="number" min={0} max={168} className={adminInput} value={s.values.auto_cancel_unpaid_hours} onChange={(e) => s.set("auto_cancel_unpaid_hours", Math.min(168, Math.max(0, Number(e.target.value) || 0)))} />
        </FieldRow>
      </div>
      <SaveButton dirty={s.dirty} saving={s.saving} onSave={() => s.save()} />
    </Card>
  );
}
