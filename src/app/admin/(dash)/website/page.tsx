import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/admin/ui";
import { AboutForm, AnnouncementForm, BrandingForm, ContactForm, HomepageForm, ReviewsPanel } from "@/components/admin/website-forms";
import { adminProducts } from "@/lib/admin-products";
import { requireAdmin } from "@/lib/auth";
import { getPublicSettings } from "@/lib/data";

export const metadata: Metadata = { title: "Website Editor" };

const TABS = [
  ["homepage", "Homepage"],
  ["branding", "Branding"],
  ["about", "About"],
  ["footer", "Footer & contact"],
  ["announcement", "Announcement"],
  ["reviews", "Reviews"],
] as const;

export default async function WebsitePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const requested = (await searchParams).tab;
  const tab = TABS.find(([k]) => k === requested)?.[0] ?? "homepage";
  const { supabase } = await requireAdmin();
  const settings = await getPublicSettings();

  let body: React.ReactNode;
  if (tab === "branding") body = <BrandingForm initial={settings.branding} />;
  else if (tab === "about") body = <AboutForm initial={settings.about} />;
  else if (tab === "footer") body = <ContactForm initial={settings.contact} />;
  else if (tab === "announcement") body = <AnnouncementForm initial={settings.announcement} />;
  else if (tab === "reviews") {
    const { data } = await supabase.from("reviews").select("id,display_name,rating,body,is_approved,created_at,order:orders(order_number)").order("is_approved").order("created_at", { ascending: false });
    body = <ReviewsPanel reviews={(data ?? []).map((r) => ({ ...r, order_number: (r.order as unknown as { order_number: string } | null)?.order_number ?? null }))} />;
  } else body = <HomepageForm initial={settings.homepage} products={(await adminProducts(supabase)).filter((p) => !p.archived_at)} />;

  return (
    <>
      <PageHeader title="Website Editor" description="Change what customers see. Saved changes go live right away." />
      <nav aria-label="Editor sections" className="no-scrollbar -mx-4 mb-5 flex gap-2 overflow-x-auto px-4">
        {TABS.map(([k, label]) => (
          <Link key={k} href={`/admin/website?tab=${k}`} aria-current={tab === k ? "page" : undefined} className={`grid h-10 shrink-0 place-items-center rounded-full px-4 text-sm font-bold ${tab === k ? "bg-cocoa text-cream" : "bg-white ring-1 ring-line hover:bg-cream"}`}>{label}</Link>
        ))}
      </nav>
      {body}
    </>
  );
}
