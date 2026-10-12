"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ImagePlus, Loader2, Plus, Star, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { saveProduct } from "@/app/admin/actions/products";
import { Toggle } from "@/components/admin/controls";
import { Card, FieldRow, adminInput } from "@/components/admin/ui";
import { DonutArt } from "@/components/brand/donut-art";
import { btn } from "@/components/ui/button";
import { publicImageUrl } from "@/lib/env";
import type { ProductInput } from "@/lib/product-schema";
import type { BoxSize, Category, Product } from "@/lib/types";
import { uploadImage } from "@/lib/upload";

const ALLERGENS = ["Gluten", "Milk", "Eggs", "Nuts", "Peanuts", "Soy", "Sesame"];
type Opt = { id?: string; kind: "variant" | "topping"; name: string; price_delta: string; is_available: boolean };

export function ProductForm({ product, categories, boxes }: { product?: Product; categories: Category[]; boxes: BoxSize[] }) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const initial = useMemo(() => ({
    name: product?.name ?? "",
    name_ar: product?.name_ar ?? "",
    description: product?.description ?? "",
    price: product ? String(product.price) : "",
    sale_price: product?.sale_price != null ? String(product.sale_price) : "",
    category_id: product?.category_id ?? categories[0]?.id ?? "",
    flavor: product?.flavor ?? "",
    ingredients: product?.ingredients ?? "",
    allergens: product?.allergens ?? [],
    is_visible: product?.is_visible ?? true,
    available: product ? !product.is_sold_out : true,
    is_featured: product?.is_featured ?? false,
    limitStock: product?.stock_quantity != null,
    stock_quantity: product?.stock_quantity != null ? String(product.stock_quantity) : "",
    box_surcharge: product ? String(product.box_surcharge) : "0",
    images: (product?.images ?? []).map((i) => ({ storage_path: i.storage_path, alt: i.alt })),
    options: (product?.options ?? []).map((o): Opt => ({ id: o.id, kind: o.kind, name: o.name, price_delta: String(o.price_delta), is_available: o.is_available })),
    box_ids: product ? boxes.filter((b) => b.eligible.includes(product.id)).map((b) => b.id) : boxes.map((b) => b.id),
  }), [product, categories, boxes]);
  const [f, setF] = useState(initial);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));
  const [uploading, setUploading] = useState(0);
  const [saving, setSaving] = useState(false);
  const [customAllergen, setCustomAllergen] = useState("");
  const dirty = JSON.stringify(f) !== JSON.stringify(initial);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirty && !saving) e.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, saving]);

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const list = Array.from(files).slice(0, 8 - f.images.length);
    setUploading((n) => n + list.length);
    for (const file of list) {
      try {
        const { path } = await uploadImage("product-images", "products", file);
        setF((s) => ({ ...s, images: [...s.images, { storage_path: path, alt: null }] }));
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Upload failed");
      } finally {
        setUploading((n) => n - 1);
      }
    }
  };

  const num = (v: string) => (v.trim() === "" ? null : Number(v));
  const submit = async () => {
    if (!f.name.trim()) return toast.error("Please give the product a name.");
    if (num(f.price) === null || Number.isNaN(num(f.price))) return toast.error("Please enter a price.");
    setSaving(true);
    const payload: ProductInput = {
      id: product?.id,
      name: f.name, name_ar: f.name_ar, description: f.description, price: Number(f.price), sale_price: num(f.sale_price),
      category_id: f.category_id || null, flavor: f.flavor, ingredients: f.ingredients, allergens: f.allergens,
      is_visible: f.is_visible, is_sold_out: !f.available, is_featured: f.is_featured,
      stock_quantity: f.limitStock ? Math.max(0, Math.floor(Number(f.stock_quantity) || 0)) : null,
      box_surcharge: Number(f.box_surcharge) || 0,
      images: f.images,
      options: f.options.map((o) => ({ ...o, price_delta: Number(o.price_delta) || 0 })),
      box_ids: f.box_ids,
    };
    const res = await saveProduct(payload);
    setSaving(false);
    if (!res.ok) return toast.error(res.error);
    toast.success(product ? "Saved! The website is updated." : "Product added to your menu!");
    setF(initial); // clears the unsaved-changes warning before leaving
    router.push("/admin/products");
    router.refresh();
  };

  const options = (kind: "variant" | "topping") => (
    <div className="space-y-2">
      {f.options.map((o, i) => o.kind !== kind ? null : (
        <div key={i} className="grid grid-cols-[1fr_110px_auto_auto] items-center gap-2">
          <input aria-label="Option name" className={adminInput} value={o.name} placeholder={kind === "variant" ? "e.g. Mini (x3)" : "e.g. Extra sprinkles"} onChange={(e) => set("options", f.options.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} maxLength={60} />
          <label className="relative">
            <span className="sr-only">Extra price in EGP</span>
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-cocoa-muted">+EGP</span>
            <input inputMode="decimal" className={`${adminInput} pl-12`} value={o.price_delta} onChange={(e) => set("options", f.options.map((x, j) => (j === i ? { ...x, price_delta: e.target.value } : x)))} />
          </label>
          <button type="button" aria-pressed={o.is_available} onClick={() => set("options", f.options.map((x, j) => (j === i ? { ...x, is_available: !x.is_available } : x)))} className={`h-10 rounded-full px-3 text-xs font-bold ${o.is_available ? "bg-good-tint text-good" : "bg-cream text-cocoa-muted ring-1 ring-line"}`}>{o.is_available ? "On" : "Off"}</button>
          <button type="button" onClick={() => set("options", f.options.filter((_, j) => j !== i))} className="grid h-10 w-10 place-items-center rounded-full hover:bg-bad-tint hover:text-bad" aria-label="Remove option"><X className="h-4 w-4" /></button>
        </div>
      ))}
      <button type="button" onClick={() => set("options", [...f.options, { kind, name: "", price_delta: "0", is_available: true }])} className={btn("secondary", "sm")}><Plus className="h-4 w-4" /> Add {kind === "variant" ? "a choice" : "a topping"}</button>
    </div>
  );

  return (
    <div className="pb-24">
      <button type="button" onClick={() => router.push("/admin/products")} className="mb-3 inline-flex h-10 items-center gap-2 font-semibold text-cocoa-muted hover:text-pink-ink"><ArrowLeft className="h-4 w-4" /> Products</button>
      <h1 className="mb-6 font-display text-3xl font-bold md:text-4xl">{product ? `Edit ${product.name}` : "Add New Donut"}</h1>
      {product?.is_sample && <p className="mb-5 rounded-[18px] bg-warn-tint px-4 py-3 font-semibold text-warn">This is a sample product. Once you save your changes it becomes a real menu item.</p>}

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <Card title="Basics">
            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldRow label="Product name" htmlFor="p-name"><input id="p-name" className={adminInput} value={f.name} onChange={(e) => set("name", e.target.value)} maxLength={80} placeholder="e.g. Pistachio Donut" /></FieldRow>
                <FieldRow label="Arabic name (optional)" htmlFor="p-name-ar"><input id="p-name-ar" dir="rtl" lang="ar" className={adminInput} value={f.name_ar} onChange={(e) => set("name_ar", e.target.value)} maxLength={80} placeholder="دونات بستاشيو" /></FieldRow>
              </div>
              <FieldRow label="Description" htmlFor="p-desc" hint="One or two sentences customers will see."><textarea id="p-desc" rows={3} className={adminInput} value={f.description} onChange={(e) => set("description", e.target.value)} maxLength={1000} /></FieldRow>
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldRow label="Price (EGP)" htmlFor="p-price"><input id="p-price" inputMode="decimal" className={adminInput} value={f.price} onChange={(e) => set("price", e.target.value)} placeholder="45" /></FieldRow>
                <FieldRow label="Sale price (optional)" htmlFor="p-sale" hint="Leave empty for no sale."><input id="p-sale" inputMode="decimal" className={adminInput} value={f.sale_price} onChange={(e) => set("sale_price", e.target.value)} /></FieldRow>
              </div>
              <FieldRow label="Category" htmlFor="p-cat">
                <select id="p-cat" className={adminInput} value={f.category_id} onChange={(e) => set("category_id", e.target.value)}>
                  <option value="">No category</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}{c.is_visible ? "" : " (hidden)"}</option>)}
                </select>
              </FieldRow>
            </div>
          </Card>

          <Card title="Choices & toppings">
            <p className="mb-3 text-sm text-cocoa-muted"><strong>Choices</strong>: the customer must pick one (like a size). Leave empty if there&apos;s only one version.</p>
            {options("variant")}
            <p className="mb-3 mt-6 text-sm text-cocoa-muted"><strong>Toppings</strong>: optional extras the customer can add.</p>
            {options("topping")}
          </Card>

          <Card title="Ingredients & allergens">
            <p className="mb-4 text-sm text-cocoa-muted">Only add what you know for sure. Customers will see exactly this.</p>
            <div className="grid gap-4">
              <FieldRow label="Flavor (optional)" htmlFor="p-flavor" hint="Helps search, and colors the placeholder picture until you add a photo."><input id="p-flavor" className={adminInput} value={f.flavor} onChange={(e) => set("flavor", e.target.value)} maxLength={60} placeholder="e.g. pistachio" /></FieldRow>
              <FieldRow label="Ingredients (optional)" htmlFor="p-ing"><textarea id="p-ing" rows={3} className={adminInput} value={f.ingredients} onChange={(e) => set("ingredients", e.target.value)} maxLength={1000} /></FieldRow>
              <fieldset>
                <legend className="text-sm font-bold">Contains these allergens</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[...new Set([...ALLERGENS, ...f.allergens])].map((a) => {
                    const on = f.allergens.includes(a);
                    return <button key={a} type="button" aria-pressed={on} onClick={() => set("allergens", on ? f.allergens.filter((x) => x !== a) : [...f.allergens, a])} className={`h-10 rounded-full px-4 text-sm font-bold ${on ? "bg-warn-tint text-warn ring-2 ring-warn/30" : "bg-cream ring-1 ring-line"}`}>{a}</button>;
                  })}
                </div>
                <div className="mt-2 flex max-w-sm gap-2">
                  <input aria-label="Other allergen" className={adminInput} value={customAllergen} onChange={(e) => setCustomAllergen(e.target.value)} placeholder="Other allergen" maxLength={40} />
                  <button type="button" className={btn("secondary", "sm")} onClick={() => { const v = customAllergen.trim(); if (v && !f.allergens.includes(v)) set("allergens", [...f.allergens, v]); setCustomAllergen(""); }}>Add</button>
                </div>
              </fieldset>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card title="Photos">
            <ul className="grid grid-cols-3 gap-2">
              {f.images.map((img, i) => (
                <li key={img.storage_path} className="group relative aspect-square overflow-hidden rounded-[14px] bg-pink-tint ring-1 ring-line">
                  <Image src={publicImageUrl("product-images", img.storage_path)} alt="" fill sizes="120px" className="object-cover" />
                  {i === 0 && <span className="absolute left-1.5 top-1.5 rounded-full bg-white px-2 py-0.5 text-[11px] font-bold">Cover</span>}
                  <span className="absolute inset-x-1 bottom-1 flex justify-between">
                    {i > 0 ? <button type="button" onClick={() => set("images", [img, ...f.images.filter((_, j) => j !== i)])} className="grid h-8 w-8 place-items-center rounded-full bg-white/90" aria-label="Make cover photo"><Star className="h-4 w-4" /></button> : <span />}
                    <button type="button" onClick={() => set("images", f.images.filter((_, j) => j !== i))} className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-bad" aria-label="Remove photo"><Trash2 className="h-4 w-4" /></button>
                  </span>
                </li>
              ))}
              {Array.from({ length: uploading }, (_, i) => <li key={`u${i}`} className="grid aspect-square place-items-center rounded-[14px] bg-cream ring-1 ring-line"><Loader2 className="h-6 w-6 animate-spin text-pink-ink" /></li>)}
              {f.images.length + uploading < 8 && (
                <li>
                  <button type="button" onClick={() => fileInput.current?.click()} className="grid aspect-square w-full place-items-center rounded-[14px] border-2 border-dashed border-pink-soft text-pink-ink hover:bg-pink-tint">
                    <span className="grid place-items-center gap-1 text-xs font-bold"><ImagePlus className="h-6 w-6" /> Add photo</span>
                  </button>
                </li>
              )}
            </ul>
            <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
            {f.images.length === 0 && (
              <div className="mt-3 flex items-center gap-3 rounded-[14px] bg-cream p-3 text-sm text-cocoa-muted">
                <DonutArt name={f.name || "donut"} flavor={f.flavor} className="h-12 w-12 shrink-0" title="" />
                Until you add a photo, the website shows this sample picture.
              </div>
            )}
            <p className="mt-2 text-xs text-cocoa-muted">Photos are resized automatically. Square photos look best.</p>
          </Card>

          <Card title="Availability">
            <div className="space-y-4">
              <Toggle checked={f.available} onChange={(v) => set("available", v)} label="Available to order" description="Switch off to show it as sold out." />
              <Toggle checked={f.is_visible} onChange={(v) => set("is_visible", v)} label="Show on website" description="Switch off to hide it for now." />
              <Toggle checked={f.is_featured} onChange={(v) => set("is_featured", v)} label="Feature on homepage" />
              <div className="border-t border-line pt-4">
                <Toggle checked={f.limitStock} onChange={(v) => set("limitStock", v)} label="Limit how many I can sell" description="Stops orders when it runs out." />
                {f.limitStock && <div className="mt-3"><FieldRow label="Number left" htmlFor="p-stock"><input id="p-stock" inputMode="numeric" className={adminInput} value={f.stock_quantity} onChange={(e) => set("stock_quantity", e.target.value.replace(/\D/g, ""))} /></FieldRow></div>}
              </div>
            </div>
          </Card>

          {boxes.length > 0 && (
            <Card title="Custom boxes">
              <fieldset>
                <legend className="mb-2 text-sm text-cocoa-muted">Customers can put this flavor in:</legend>
                <div className="space-y-2">
                  {boxes.map((b) => (
                    <label key={b.id} className="flex cursor-pointer items-center gap-3">
                      <input type="checkbox" className="h-5 w-5 accent-[var(--pink-ink)]" checked={f.box_ids.includes(b.id)} onChange={(e) => set("box_ids", e.target.checked ? [...f.box_ids, b.id] : f.box_ids.filter((x) => x !== b.id))} />
                      <span className="font-semibold">{b.name}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="mt-4"><FieldRow label="Premium surcharge per donut (EGP)" htmlFor="p-sur" hint="Extra charged for each one in a box. 0 = no extra."><input id="p-sur" inputMode="decimal" className={adminInput} value={f.box_surcharge} onChange={(e) => set("box_surcharge", e.target.value)} /></FieldRow></div>
            </Card>
          )}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-16 z-20 border-t border-line bg-white/95 px-4 py-3 backdrop-blur lg:bottom-0 lg:left-64">
        <div className="mx-auto flex max-w-[1180px] items-center justify-end gap-3">
          {dirty && <span className="mr-auto text-sm font-semibold text-warn">Unsaved changes</span>}
          <button type="button" onClick={submit} disabled={saving || uploading > 0} className={btn("primary", "lg", "w-full sm:w-auto")}>
            {saving && <Loader2 className="h-5 w-5 animate-spin" />} {product ? "Save Changes" : "Save Product"}
          </button>
        </div>
      </div>
    </div>
  );
}
