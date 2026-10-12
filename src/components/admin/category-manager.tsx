"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Plus, Tags, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createCategory, deleteCategory, moveCategory, updateCategory } from "@/app/admin/actions/catalog";
import { ConfirmDialog } from "@/components/admin/controls";
import { EmptyState, adminInput } from "@/components/admin/ui";
import { btn } from "@/components/ui/button";
import type { Category } from "@/lib/types";

export function CategoryManager({ categories, counts }: { categories: Category[]; counts: Record<string, number> }) {
  const router = useRouter();
  const [, start] = useTransition();
  const [newName, setNewName] = useState("");
  const [names, setNames] = useState<Record<string, string>>(Object.fromEntries(categories.map((c) => [c.id, c.name])));
  const [moveTo, setMoveTo] = useState("");
  const act = async (p: Promise<{ ok: boolean; error?: string }>, msg?: string) => {
    const res = await p;
    if (!res.ok) toast.error(res.error); else { if (msg) toast.success(msg); start(() => router.refresh()); }
    return res.ok;
  };

  return (
    <div className="space-y-5">
      <form className="flex gap-2 rounded-[20px] bg-white p-4 ring-1 ring-line" onSubmit={async (e) => { e.preventDefault(); if (await act(createCategory(newName), "Category added")) setNewName(""); }}>
        <label htmlFor="new-cat" className="sr-only">New category name</label>
        <input id="new-cat" className={adminInput} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New category, e.g. Mini Donuts" maxLength={60} />
        <button type="submit" disabled={!newName.trim()} className={btn("primary", "md")}><Plus className="h-4 w-4" /> Add</button>
      </form>

      {categories.length === 0 ? <EmptyState icon={Tags} title="No categories yet" text="Categories group your menu, like Classic or Filled donuts." /> : (
        <ul className="grid gap-2">
          {categories.map((c, i) => (
            <li key={c.id} className="flex flex-wrap items-center gap-2 rounded-[18px] bg-white p-3 ring-1 ring-line sm:flex-nowrap">
              <input aria-label={`Name of ${c.name}`} className={`${adminInput} flex-1`} value={names[c.id] ?? c.name} onChange={(e) => setNames((n) => ({ ...n, [c.id]: e.target.value }))} onBlur={() => names[c.id]?.trim() && names[c.id] !== c.name && act(updateCategory(c.id, { name: names[c.id] }), "Renamed")} maxLength={60} />
              <span className="w-24 text-sm text-cocoa-muted">{counts[c.id] ?? 0} product{counts[c.id] === 1 ? "" : "s"}</span>
              <button type="button" aria-pressed={c.is_visible} onClick={() => act(updateCategory(c.id, { is_visible: !c.is_visible }), c.is_visible ? "Hidden. Its products are hidden from the website too." : "Visible again")} className={`h-9 rounded-full px-3 text-xs font-bold ${c.is_visible ? "bg-good-tint text-good" : "bg-cream text-cocoa-muted ring-1 ring-line"}`}>{c.is_visible ? "Visible" : "Hidden"}</button>
              <button type="button" disabled={i === 0} onClick={() => act(moveCategory(c.id, -1))} className="grid h-9 w-9 place-items-center rounded-full hover:bg-cream disabled:opacity-30" aria-label={`Move ${c.name} up`}><ArrowUp className="h-4 w-4" /></button>
              <button type="button" disabled={i === categories.length - 1} onClick={() => act(moveCategory(c.id, 1))} className="grid h-9 w-9 place-items-center rounded-full hover:bg-cream disabled:opacity-30" aria-label={`Move ${c.name} down`}><ArrowDown className="h-4 w-4" /></button>
              <ConfirmDialog
                title={`Delete "${c.name}"?`}
                body={counts[c.id] ? (
                  <div className="space-y-3">
                    <p>{counts[c.id]} product{counts[c.id] === 1 ? " is" : "s are"} in this category. Where should {counts[c.id] === 1 ? "it" : "they"} go?</p>
                    <select aria-label="Move products to" className={adminInput} value={moveTo} onChange={(e) => setMoveTo(e.target.value)}>
                      <option value="">No category</option>
                      {categories.filter((x) => x.id !== c.id).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                    </select>
                  </div>
                ) : "This category is empty, so nothing else changes."}
                confirmLabel="Delete category"
                tone="danger"
                onConfirm={() => act(deleteCategory(c.id, moveTo || null), "Category deleted")}
                trigger={(open) => <button type="button" onClick={() => { setMoveTo(""); open(); }} className="grid h-9 w-9 place-items-center rounded-full hover:bg-bad-tint hover:text-bad" aria-label={`Delete ${c.name}`}><Trash2 className="h-4 w-4" /></button>}
              />
            </li>
          ))}
        </ul>
      )}
      <p className="text-sm text-cocoa-muted">Hiding a category also hides its products from the website. The order here is the order on your menu.</p>
    </div>
  );
}
