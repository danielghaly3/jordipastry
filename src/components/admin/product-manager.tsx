"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Archive, ArchiveRestore, ArrowDown, ArrowUp, Copy, Cookie, EllipsisVertical, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { archiveProduct, deleteProduct, duplicateProduct, moveProduct, setProductFlags } from "@/app/admin/actions/products";
import { ConfirmDialog } from "@/components/admin/controls";
import { EmptyState, Pill, adminInput } from "@/components/admin/ui";
import { ProductImageClient } from "@/components/store/product-image-client";
import { btn } from "@/components/ui/button";
import { publicImageUrl } from "@/lib/env";
import { formatEGP } from "@/lib/format";
import type { Category, Product } from "@/lib/types";

function FlagButton({ on, onLabel, offLabel, onClick, tone }: { on: boolean; onLabel: string; offLabel: string; onClick: () => void; tone: "good" | "pink" }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on} className={`h-9 rounded-full px-3 text-xs font-bold transition ${on ? (tone === "good" ? "bg-good-tint text-good" : "bg-pink-tint text-pink-ink") : "bg-cream text-cocoa-muted ring-1 ring-line"}`}>
      {on ? onLabel : offLabel}
    </button>
  );
}

export function ProductManager({ products, categories }: { products: Product[]; categories: Category[] }) {
  const router = useRouter();
  const [, start] = useTransition();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [view, setView] = useState<"active" | "archived">("active");
  const refresh = () => start(() => router.refresh());
  const act = async (p: Promise<{ ok: boolean; error?: string }>, msg?: string) => {
    const res = await p;
    if (!res.ok) toast.error(res.error ?? "Something went wrong");
    else { if (msg) toast.success(msg); refresh(); }
    return res.ok;
  };

  const shown = useMemo(() => products.filter((p) => (view === "archived" ? p.archived_at : !p.archived_at) && (!cat || p.category_id === cat) && (!q || p.name.toLowerCase().includes(q.toLowerCase()))), [products, view, cat, q]);
  const filtering = Boolean(q || cat);

  return (
    <>
      <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_200px_auto]">
        <label className="relative">
          <span className="sr-only">Search products</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-cocoa-muted" />
          <input type="search" className={`${adminInput} pl-11`} placeholder="Search products" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <select aria-label="Category" className={adminInput} value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div className="flex gap-1 rounded-full bg-white p-1 ring-1 ring-line">
          {(["active", "archived"] as const).map((v) => (
            <button key={v} type="button" onClick={() => setView(v)} aria-pressed={view === v} className={`h-9 rounded-full px-4 text-sm font-bold ${view === v ? "bg-cocoa text-cream" : ""}`}>{v === "active" ? "On menu" : "Archived"}</button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <EmptyState icon={Cookie} title={view === "archived" ? "Nothing archived" : filtering ? "No products match" : "No products yet"} text={view === "active" && !filtering ? "Add your first donut and it will appear on the website right away." : undefined} action={view === "active" && !filtering && <Link href="/admin/products/new" className={btn("primary", "md")}><Plus className="h-4 w-4" /> Add Product</Link>} />
      ) : (
        <ul className="grid gap-2">
          {shown.map((p, i) => (
            <li key={p.id} className="flex flex-wrap items-center gap-3 rounded-[18px] bg-white p-3 ring-1 ring-line md:flex-nowrap">
              <Link href={`/admin/products/${p.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                <ProductImageClient name={p.name} flavor={p.flavor} url={p.images[0] ? publicImageUrl("product-images", p.images[0].storage_path) : null} className="h-16 w-16 shrink-0 overflow-hidden rounded-[14px] bg-pink-tint" />
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-1.5">
                    <span className="font-bold">{p.name}</span>
                    {p.is_sample && <Pill tone="warn">Sample</Pill>}
                    {!p.images.length && <Pill>No photo</Pill>}
                  </span>
                  <span className="block text-sm text-cocoa-muted">
                    {p.category?.name ?? "No category"} · {p.sale_price !== null ? <><s>{formatEGP(p.price)}</s> {formatEGP(p.sale_price)}</> : formatEGP(p.price)}
                    {p.stock_quantity !== null && ` · ${p.stock_quantity} in stock`}
                  </span>
                </span>
              </Link>
              {view === "active" ? (
                <div className="flex w-full flex-wrap items-center gap-1.5 md:w-auto">
                  <FlagButton tone="good" on={!p.is_sold_out} onLabel="Available" offLabel="Sold out" onClick={() => act(setProductFlags(p.id, { is_sold_out: !p.is_sold_out }), p.is_sold_out ? `${p.name} is available` : `${p.name} marked sold out`)} />
                  <FlagButton tone="good" on={p.is_visible} onLabel="Visible" offLabel="Hidden" onClick={() => act(setProductFlags(p.id, { is_visible: !p.is_visible }), p.is_visible ? "Hidden from website" : "Shown on website")} />
                  <FlagButton tone="pink" on={p.is_featured} onLabel="★ Featured" offLabel="Feature" onClick={() => act(setProductFlags(p.id, { is_featured: !p.is_featured }))} />
                  <span className="ml-auto flex md:ml-1">
                    <button type="button" disabled={i === 0 || filtering} onClick={() => act(moveProduct(p.id, -1))} className="grid h-9 w-9 place-items-center rounded-full hover:bg-cream disabled:opacity-30" aria-label={`Move ${p.name} up`}><ArrowUp className="h-4 w-4" /></button>
                    <button type="button" disabled={i === shown.length - 1 || filtering} onClick={() => act(moveProduct(p.id, 1))} className="grid h-9 w-9 place-items-center rounded-full hover:bg-cream disabled:opacity-30" aria-label={`Move ${p.name} down`}><ArrowDown className="h-4 w-4" /></button>
                    <RowMenu product={p} act={act} router={router} />
                  </span>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button type="button" onClick={() => act(archiveProduct(p.id, false), "Back on the menu")} className={btn("secondary", "sm")}><ArchiveRestore className="h-4 w-4" /> Restore</button>
                  <DeleteButton product={p} act={act} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {filtering && view === "active" && <p className="mt-3 text-sm text-cocoa-muted">Clear the search and category filter to reorder products.</p>}
    </>
  );
}

type Act = (p: Promise<{ ok: boolean; error?: string }>, msg?: string) => Promise<boolean>;

function DeleteButton({ product, act }: { product: Product; act: Act }) {
  return (
    <ConfirmDialog
      title={`Delete ${product.name} forever?`}
      body="Its photos are deleted too. Past orders keep their copy of the name and price. If you might sell it again, archive it instead."
      confirmLabel="Delete forever"
      tone="danger"
      onConfirm={() => act(deleteProduct(product.id), "Product deleted")}
      trigger={(open) => <button type="button" onClick={open} className={btn("ghost", "sm", "text-bad")}><Trash2 className="h-4 w-4" /> Delete</button>}
    />
  );
}

function RowMenu({ product, act, router }: { product: Product; act: Act; router: ReturnType<typeof useRouter> }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-haspopup="menu" className="grid h-9 w-9 place-items-center rounded-full hover:bg-cream" aria-label={`More actions for ${product.name}`}><EllipsisVertical className="h-4 w-4" /></button>
      {open && (
        <>
          <span className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden="true" />
          <span role="menu" className="absolute right-0 top-10 z-20 grid w-48 rounded-[16px] bg-white p-1.5 shadow-lift ring-1 ring-line" onKeyDown={(e) => e.key === "Escape" && setOpen(false)}>
            <Link role="menuitem" href={`/admin/products/${product.id}`} className="flex h-10 items-center gap-2 rounded-xl px-3 font-semibold hover:bg-cream"><Pencil className="h-4 w-4" /> Edit</Link>
            <button role="menuitem" type="button" className="flex h-10 items-center gap-2 rounded-xl px-3 text-left font-semibold hover:bg-cream" onClick={async () => {
              setOpen(false);
              const res = await duplicateProduct(product.id);
              if (!res.ok) return toast.error(res.error);
              toast.success("Copy created (hidden until you edit it)");
              router.push(`/admin/products/${res.data.id}`);
            }}><Copy className="h-4 w-4" /> Duplicate</button>
            <button role="menuitem" type="button" className="flex h-10 items-center gap-2 rounded-xl px-3 text-left font-semibold hover:bg-cream" onClick={() => { setOpen(false); act(archiveProduct(product.id, true), "Archived. Find it under Archived."); }}><Archive className="h-4 w-4" /> Archive</button>
          </span>
        </>
      )}
    </span>
  );
}
