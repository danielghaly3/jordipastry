"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowDown, ArrowUp, Check, Eye, EyeOff, Loader2, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { moderateReview, setFeatured } from "@/app/admin/actions/catalog";
import { Toggle } from "@/components/admin/controls";
import { ImageField, SaveBar, useSettingForm } from "@/components/admin/settings-kit";
import { Card, EmptyState, FieldRow, Pill, adminInput } from "@/components/admin/ui";
import { Logo } from "@/components/brand/logo";
import { btn } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import { ACCENTS, HOME_SECTIONS, PALETTES, type PublicSettings } from "@/lib/settings";
import type { Product } from "@/lib/types";

const text = (id: string, label: string, value: string, onChange: (v: string) => void, max: number, hint?: string, rows = 0) => (
  <FieldRow label={label} htmlFor={id} hint={hint}>
    {rows ? <textarea id={id} rows={rows} className={adminInput} value={value} maxLength={max} onChange={(e) => onChange(e.target.value)} />
      : <input id={id} className={adminInput} value={value} maxLength={max} onChange={(e) => onChange(e.target.value)} />}
  </FieldRow>
);

export function BrandingForm({ initial }: { initial: PublicSettings["branding"] }) {
  const { values: v, set, save, saving, dirty } = useSettingForm("branding", initial);
  const swatch = (on: boolean) => `flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-4 text-sm font-bold ring-2 ${on ? "ring-cocoa" : "ring-line"}`;
  return (
    <>
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <Card title="Names">
            <div className="grid gap-4 sm:grid-cols-2">
              {text("b-store", "Store name", v.store_name, (x) => set("store_name", x), 60, "Used in page titles and messages.")}
              {text("b-tag", "Tagline", v.tagline, (x) => set("tagline", x), 120)}
              {text("b-word", "Logo word", v.wordmark, (x) => set("wordmark", x), 16, "Shown when no logo image is uploaded.")}
              {text("b-desc", "Small word under it", v.descriptor, (x) => set("descriptor", x), 20)}
            </div>
          </Card>
          <Card title="Logo & icon">
            <div className="grid gap-5 sm:grid-cols-2">
              <ImageField label="Full logo (optional)" value={v.logo_url} onChange={(x) => set("logo_url", x)} folder="branding" hint="Replaces the drawn logo everywhere. PNG with transparent background works best." accept="image/png,image/webp,image/svg+xml,image/jpeg" />
              <ImageField label="Logo mark (optional)" value={v.logo_mark_url} onChange={(x) => set("logo_mark_url", x)} folder="branding" square hint="The small symbol next to the name." accept="image/png,image/webp,image/svg+xml" />
              <ImageField label="Browser tab icon (favicon)" value={v.favicon_url} onChange={(x) => set("favicon_url", x)} folder="branding" square hint="A square PNG, at least 64×64." accept="image/png,image/x-icon,image/svg+xml" />
            </div>
          </Card>
          <Card title="Brand colors">
            <p className="mb-3 text-sm text-cocoa-muted">These color sets are pre-checked so text stays easy to read.</p>
            <fieldset><legend className="mb-2 text-sm font-bold">Main color</legend>
              <div className="flex flex-wrap gap-2">
                {Object.entries(PALETTES).map(([k, p]) => (
                  <button key={k} type="button" aria-pressed={v.palette === k} onClick={() => set("palette", k as typeof v.palette)} className={swatch(v.palette === k)}>
                    <span className="h-7 w-7 rounded-full" style={{ background: p.pink }} /> {p.label}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset className="mt-4"><legend className="mb-2 text-sm font-bold">Accent color</legend>
              <div className="flex flex-wrap gap-2">
                {Object.entries(ACCENTS).map(([k, a]) => (
                  <button key={k} type="button" aria-pressed={v.accent === k} onClick={() => set("accent", k as typeof v.accent)} className={swatch(v.accent === k)}>
                    <span className="h-7 w-7 rounded-full" style={{ background: a.accent }} /> {a.label}
                  </button>
                ))}
              </div>
            </fieldset>
          </Card>
        </div>
        <Card title="Preview" className="h-fit lg:sticky lg:top-6">
          <div className="rounded-[18px] bg-[#fff9f3] p-4" style={{ ["--pink" as string]: PALETTES[v.palette].pink, ["--pink-ink" as string]: PALETTES[v.palette].ink, ["--pink-soft" as string]: PALETTES[v.palette].soft, ["--accent" as string]: ACCENTS[v.accent].accent, ["--accent-ink" as string]: ACCENTS[v.accent].ink }}>
            <div className="rounded-[18px] bg-white p-3 shadow-cloud"><Logo branding={v} /></div>
            <p className="mt-4 font-display text-xl font-semibold" style={{ color: PALETTES[v.palette].ink }}>{v.tagline}</p>
            <span className="mt-3 inline-flex h-11 items-center rounded-full px-5 font-semibold text-white" style={{ background: PALETTES[v.palette].ink }}>Order Your Donuts</span>
          </div>
        </Card>
      </div>
      <SaveBar dirty={dirty} saving={saving} onSave={() => save()} />
    </>
  );
}

export function HomepageForm({ initial, products }: { initial: PublicSettings["homepage"]; products: Product[] }) {
  const { values: v, set, save, saving, dirty } = useSettingForm("homepage", initial);
  const router = useRouter();
  const [featured, setFeat] = useState(products.filter((p) => p.is_featured).map((p) => p.id));
  const [savingFeat, setSavingFeat] = useState(false);
  const move = (i: number, d: -1 | 1) => { const s = [...v.sections]; [s[i], s[i + d]] = [s[i + d], s[i]]; set("sections", s); };
  const label = (id: string) => HOME_SECTIONS.find((s) => s.id === id)?.label ?? id;

  return (
    <>
      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          <Card title="Top of the homepage">
            <div className="grid gap-4">
              {text("h-head", "Big headline", v.hero_headline, (x) => set("hero_headline", x), 60, "Keep it short. The last word is shown in pink.")}
              {text("h-desc", "Text under the headline", v.hero_description, (x) => set("hero_description", x), 160, undefined, 2)}
              <div className="grid gap-4 sm:grid-cols-2">
                {text("h-cta1", "Main button", v.cta_primary, (x) => set("cta_primary", x), 28)}
                {text("h-cta2", "Second button", v.cta_secondary, (x) => set("cta_secondary", x), 28)}
              </div>
              <ImageField label="Hero photo (optional)" value={v.hero_image_url} onChange={(x) => set("hero_image_url", x)} folder="homepage" square hint="A round donut photo looks best. Without one, your featured donuts float here." />
            </div>
          </Card>
          <Card title="Sections">
            <p className="mb-3 text-sm text-cocoa-muted">Show, hide and reorder the parts of your homepage.</p>
            <ul className="grid gap-2">
              {v.sections.map((s, i) => (
                <li key={s.id} className={`${s.id === "reviews" ? "hidden" : "flex"} items-center gap-2 rounded-xl px-3 py-2 ring-1 ring-line ${s.visible ? "bg-white" : "bg-cream text-cocoa-muted"}`}>
                  <span className="flex-1 font-semibold">{label(s.id)}</span>
                  <button type="button" onClick={() => set("sections", v.sections.map((x, j) => (j === i ? { ...x, visible: !x.visible } : x)))} aria-pressed={s.visible} className="grid h-9 w-9 place-items-center rounded-full hover:bg-cream" aria-label={s.visible ? `Hide ${label(s.id)}` : `Show ${label(s.id)}`}>{s.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</button>
                  <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-cream disabled:opacity-30" aria-label="Move up"><ArrowUp className="h-4 w-4" /></button>
                  <button type="button" disabled={i === v.sections.length - 1} onClick={() => move(i, 1)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-cream disabled:opacity-30" aria-label="Move down"><ArrowDown className="h-4 w-4" /></button>
                </li>
              ))}
            </ul>
          </Card>
          <Card title="Featured donuts" action={
            <button type="button" disabled={savingFeat} className={btn("secondary", "sm")} onClick={async () => {
              setSavingFeat(true);
              const r = await setFeatured(featured);
              setSavingFeat(false);
              if (!r.ok) return toast.error(r.error);
              toast.success("Featured donuts saved");
              router.refresh();
            }}>{savingFeat && <Loader2 className="h-4 w-4 animate-spin" />} Save featured</button>
          }>
            <p className="mb-3 text-sm text-cocoa-muted">These star in the homepage showcase and float in the top section.</p>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {products.map((p) => (
                <label key={p.id} className="flex cursor-pointer items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-cream">
                  <input type="checkbox" className="h-5 w-5 accent-[var(--pink-ink)]" checked={featured.includes(p.id)} onChange={(e) => setFeat((f) => (e.target.checked ? [...f, p.id] : f.filter((x) => x !== p.id)))} />
                  <span className="font-semibold">{p.name}</span>
                  {!p.is_visible && <Pill>Hidden</Pill>}
                </label>
              ))}
            </div>
          </Card>
        </div>
        <Card title="Preview" className="h-fit lg:sticky lg:top-6">
          <div className="rounded-[18px] bg-[#fff9f3] p-5">
            <p className="font-display text-3xl font-bold leading-tight text-cocoa">{v.hero_headline.split(" ").slice(0, -1).join(" ")} <span className="text-pink-ink">{v.hero_headline.split(" ").slice(-1)}</span></p>
            <p className="mt-2 text-sm text-cocoa-muted">{v.hero_description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex h-10 items-center rounded-full bg-pink-ink px-4 text-sm font-semibold text-white">{v.cta_primary}</span>
              <span className="inline-flex h-10 items-center rounded-full bg-white px-4 text-sm font-semibold ring-1 ring-line">{v.cta_secondary}</span>
            </div>
          </div>
          <a href="/" target="_blank" className="mt-3 inline-block text-sm font-semibold text-pink-ink hover:underline">Open the live homepage</a>
        </Card>
      </div>
      <SaveBar dirty={dirty} saving={saving} onSave={() => save()} />
    </>
  );
}

export function AboutForm({ initial }: { initial: PublicSettings["about"] }) {
  const { values: v, set, save, saving, dirty } = useSettingForm("about", initial);
  return (
    <>
      <Card title="About page">
        <div className="grid gap-4">
          {text("a-head", "Headline", v.headline, (x) => set("headline", x), 80)}
          {text("a-short", "Short description", v.short, (x) => set("short", x), 240, "Shown on the homepage and at the top of the About page.", 2)}
          {text("a-story", "Your story", v.story, (x) => set("story", x), 3000, "How Jordi started, what you love baking. Leave empty to hide this part.", 8)}
          <ImageField label="About photo (optional)" value={v.image_url} onChange={(x) => set("image_url", x)} folder="about" square hint="You, your kitchen or your donuts." />
        </div>
      </Card>
      <SaveBar dirty={dirty} saving={saving} onSave={() => save()} />
    </>
  );
}

export function ContactForm({ initial }: { initial: PublicSettings["contact"] }) {
  const { values: v, set, save, saving, dirty } = useSettingForm("contact", initial);
  return (
    <>
      <Card title="Contact details & hours">
        <p className="mb-4 text-sm text-cocoa-muted">Shown in the footer and on the Contact page. Empty fields are hidden.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {text("c-wa", "WhatsApp number", v.whatsapp, (x) => set("whatsapp", x), 30, "Customers tap to chat with you. e.g. 010 1234 5678")}
          {text("c-phone", "Phone number", v.phone, (x) => set("phone", x), 30)}
          {text("c-email", "Email", v.email, (x) => set("email", x), 120)}
          {text("c-area", "Area (no full address)", v.area, (x) => set("area", x), 120, "e.g. Heliopolis, Cairo")}
          {text("c-ig", "Instagram link", v.instagram, (x) => set("instagram", x), 500, "Full link, starting with https://")}
          {text("c-fb", "Facebook link", v.facebook, (x) => set("facebook", x), 500)}
          {text("c-tt", "TikTok link", v.tiktok, (x) => set("tiktok", x), 500)}
          {text("c-hours", "Store hours", v.hours, (x) => set("hours", x), 200, "e.g. Daily 10:00 to 22:00", 2)}
        </div>
      </Card>
      <SaveBar dirty={dirty} saving={saving} onSave={() => save()} />
    </>
  );
}

export function AnnouncementForm({ initial }: { initial: PublicSettings["announcement"] }) {
  const { values: v, set, save, saving, dirty } = useSettingForm("announcement", initial);
  return (
    <>
      <Card title="Announcement bar">
        <div className="grid gap-4">
          <Toggle checked={v.enabled} onChange={(x) => set("enabled", x)} label="Show the announcement bar" description="A slim message at the very top of every page." />
          {text("an-text", "Message", v.text, (x) => set("text", x), 120, "e.g. Orders close at 20:00 today!")}
          <div className="flex flex-wrap gap-2">
            {["Fresh Donuts Available Today!", "Orders close at 20:00 today.", "New flavor just landed!"].map((s) => <button key={s} type="button" onClick={() => set("text", s)} className={btn("secondary", "sm")}>{s}</button>)}
          </div>
          <div>
            <p className="mb-2 text-sm font-bold">Preview</p>
            <div className={`rounded-xl bg-pink-ink px-4 py-2 text-center text-sm font-semibold text-white ${v.enabled ? "" : "opacity-40"}`}>{v.text || "Your message"}</div>
            {!v.enabled && <p className="mt-1 text-sm text-cocoa-muted">Turned off: customers won&apos;t see it.</p>}
          </div>
        </div>
      </Card>
      <SaveBar dirty={dirty} saving={saving} onSave={() => save()} />
    </>
  );
}

type ReviewRow = { id: string; display_name: string; rating: number; body: string; is_approved: boolean; created_at: string; order_number: string | null };

export function ReviewsPanel({ reviews }: { reviews: ReviewRow[] }) {
  const router = useRouter();
  const act = async (id: string, a: "approve" | "hide" | "delete") => {
    const r = await moderateReview(id, a);
    if (!r.ok) return toast.error(r.error);
    toast.success(a === "approve" ? "Review is live" : a === "hide" ? "Review hidden" : "Review deleted");
    router.refresh();
  };
  if (reviews.length === 0) return <EmptyState icon={Star} title="No reviews yet" text="Customers can review an order after you mark it Completed. Reviews appear here for your approval." />;
  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {reviews.map((r) => (
        <li key={r.id} className="rounded-[18px] bg-white p-4 ring-1 ring-line">
          <div className="flex items-center justify-between gap-2">
            <span className="flex text-accent" aria-label={`${r.rating} of 5 stars`}>{Array.from({ length: 5 }, (_, i) => <Star key={i} className={`h-4 w-4 ${i < r.rating ? "fill-current" : "opacity-30"}`} />)}</span>
            {r.is_approved ? <Pill tone="good">Live on website</Pill> : <Pill tone="warn">Waiting for approval</Pill>}
          </div>
          <p className="mt-2">“{r.body}”</p>
          <p className="mt-2 text-sm text-cocoa-muted">{r.display_name}{r.order_number ? ` · #${r.order_number}` : ""} · {formatDateTime(r.created_at)}</p>
          <div className="mt-3 flex gap-2">
            {r.is_approved ? <button type="button" onClick={() => act(r.id, "hide")} className={btn("secondary", "sm")}><EyeOff className="h-4 w-4" /> Hide</button>
              : <button type="button" onClick={() => act(r.id, "approve")} className={btn("good", "sm")}><Check className="h-4 w-4" /> Approve</button>}
            <button type="button" onClick={() => act(r.id, "delete")} className={btn("ghost", "sm", "text-bad")}><Trash2 className="h-4 w-4" /> Delete</button>
          </div>
        </li>
      ))}
    </ul>
  );
}
