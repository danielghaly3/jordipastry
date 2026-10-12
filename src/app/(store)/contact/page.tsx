import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { btn } from "@/components/ui/button";
import { getPublicSettings } from "@/lib/data";
import { normalizeEgyptPhone, prettyPhone, whatsappLink } from "@/lib/phone";

export const metadata: Metadata = { title: "Contact", description: "Get in touch with Jordi Pastry on WhatsApp or by phone." };

export default async function ContactPage() {
  const { contact, branding } = await getPublicSettings();
  const phone = contact.phone ? normalizeEgyptPhone(contact.phone) ?? contact.phone : "";
  const rows = [
    phone && { icon: Phone, label: "Phone", value: prettyPhone(phone), href: `tel:${phone}` },
    contact.email && { icon: Mail, label: "Email", value: contact.email, href: `mailto:${contact.email}` },
    contact.area && { icon: MapPin, label: "Where we are", value: contact.area },
    contact.hours && { icon: Clock, label: "Hours", value: contact.hours },
  ].filter(Boolean) as { icon: typeof Phone; label: string; value: string; href?: string }[];
  const socials = [["Instagram", contact.instagram], ["Facebook", contact.facebook], ["TikTok", contact.tiktok]].filter(([, u]) => u);

  return (
    <div className="mx-auto max-w-[920px] px-5 pt-10 md:px-8 md:pt-14">
      <h1 className="font-display text-[clamp(2rem,4.8vw,3.4rem)] font-bold leading-[1.1] tracking-[-0.02em]">Say <span className="script-accent text-pink-ink">hello</span></h1>
      <p className="mt-3 text-lg text-cocoa-muted">Questions about an order, a big celebration or a custom box? We&apos;d love to hear from you.</p>

      {contact.whatsapp && (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-5 rounded-[32px] bg-pink-ink p-7 text-white md:p-10">
          <div>
            <p className="font-display text-3xl font-bold">Fastest on WhatsApp</p>
            <p className="mt-1 text-white/90">Tap to start a chat with {branding.store_name}.</p>
          </div>
          <a href={whatsappLink(contact.whatsapp, `Hi ${branding.store_name}!`)} target="_blank" rel="noopener noreferrer" className="inline-flex h-14 items-center gap-2 rounded-full bg-white px-7 font-semibold text-pink-ink hover:bg-pink-tint">
            <MessageCircle className="h-5 w-5" /> Message us
          </a>
        </div>
      )}

      {rows.length > 0 || socials.length > 0 ? (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {rows.map((r) => (
            <li key={r.label} className="flex gap-4 rounded-[28px] bg-white p-6 shadow-cloud">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-pink-tint text-pink-ink"><r.icon className="h-5 w-5" /></span>
              <span>
                <span className="block text-sm font-semibold text-cocoa-muted">{r.label}</span>
                {r.href ? <a href={r.href} className="font-semibold hover:text-pink-ink">{r.value}</a> : <span className="whitespace-pre-line font-semibold">{r.value}</span>}
              </span>
            </li>
          ))}
          {socials.length > 0 && (
            <li className="flex flex-wrap items-center gap-2 rounded-[28px] bg-white p-6 shadow-cloud sm:col-span-2">
              <span className="mr-2 font-semibold">Follow us</span>
              {socials.map(([label, url]) => <a key={label} href={url} target="_blank" rel="noopener noreferrer" className={btn("secondary", "sm")}>{label}</a>)}
            </li>
          )}
        </ul>
      ) : (
        !contact.whatsapp && <p className="mt-8 rounded-[28px] bg-white p-8 text-center text-cocoa-muted shadow-cloud">Contact details are coming soon.</p>
      )}
    </div>
  );
}
