import Link from "next/link";
import { Clock, CreditCard, Heart, Mail, MapPin, Phone } from "lucide-react";
import { Doodles } from "@/components/brand/ribbon";
import { LogoMark } from "@/components/brand/logo";
import { Drip } from "@/components/home/drip";
import { prettyPhone, normalizeEgyptPhone, whatsappLink } from "@/lib/phone";
import { DEFAULT_CONTACT_EMAIL, DEFAULT_SOCIAL_LINKS, type PublicSettings } from "@/lib/settings";

const SHOP = [["/menu", "Our Menu"], ["/build-a-box", "Build a Box"], ["/cart", "Your Cart"]];
const INFO = [["/about", "About Us"], ["/contact", "Contact"], ["/privacy", "Privacy"], ["/terms", "Terms"]];

function Chip({ icon: Icon }: { icon: typeof Phone }) {
  return <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-pink-ink shadow-cloud"><Icon className="h-4 w-4" /></span>;
}

const SOCIAL_ICONS = {
  WhatsApp: "M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48a9 9 0 0 1-1.66-2.06c-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.21 5.1 4.5.71.31 1.27.49 1.7.63.72.23 1.37.2 1.88.12.58-.09 1.76-.72 2.01-1.42.25-.7.25-1.3.18-1.42-.08-.13-.28-.2-.58-.35ZM12.04 2a9.84 9.84 0 0 0-8.36 15.03L2.05 22l5.12-1.6A9.84 9.84 0 1 0 12.04 2Zm0 17.9a8.02 8.02 0 0 1-4.09-1.12l-.29-.17-3.04.95.99-2.97-.19-.3a8.04 8.04 0 1 1 6.62 3.61Z",
  Instagram: "M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.67 4.77-4.92 4.92-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-3.25-.15-4.77-1.69-4.92-4.92C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85C2.38 3.92 3.9 2.38 7.15 2.23 8.42 2.17 8.8 2.16 12 2.16Zm0-2.16C8.74 0 8.33.01 7.05.07 2.7.27.27 2.69.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.63 6.78 6.98 6.98C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95C23.73 2.69 21.3.27 16.95.07 15.67.01 15.26 0 12 0Zm0 5.84A6.16 6.16 0 1 0 12 18.16 6.16 6.16 0 0 0 12 5.84Zm0 10.16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm7.85-10.4a1.44 1.44 0 1 1-2.88 0 1.44 1.44 0 0 1 2.88 0Z",
  Facebook: "M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.03 1.79-4.7 4.53-4.7 1.31 0 2.69.24 2.69.24v2.98h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07Z",
  TikTok: "M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.9 2.9 0 1 1-2-2.76V9.4a6.33 6.33 0 1 0 5.45 6.27V8.73a8.16 8.16 0 0 0 4.77 1.52V6.82c-.34 0-.67-.04-1-.13Z",
} as const;

function BrandIcon({ label, className = "h-4 w-4" }: { label: keyof typeof SOCIAL_ICONS; className?: string }) {
  return <svg viewBox="0 0 24 24" className={`${className} fill-current`} aria-hidden="true"><path d={SOCIAL_ICONS[label]} /></svg>;
}

function BrandChip({ label }: { label: keyof typeof SOCIAL_ICONS }) {
  return <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-pink-ink shadow-cloud"><BrandIcon label={label} /></span>;
}

export function Footer({ settings }: { settings: Pick<PublicSettings, "branding" | "contact" | "store"> }) {
  const { branding, contact, store } = settings;
  const phone = contact.phone ? normalizeEgyptPhone(contact.phone) ?? contact.phone : "";
  const email = contact.email || DEFAULT_CONTACT_EMAIL;
  const socialLinks = [
    { label: "Instagram", href: contact.instagram || DEFAULT_SOCIAL_LINKS.instagram },
    { label: "Facebook", href: contact.facebook || DEFAULT_SOCIAL_LINKS.facebook },
    { label: "TikTok", href: contact.tiktok || DEFAULT_SOCIAL_LINKS.tiktok },
  ] as const;

  return (
    <footer className="relative mt-28 bg-pink-soft text-cocoa">
      {/* rose glaze running over the top edge, like the printed menu boards */}
      <div className="absolute inset-x-0 top-0" aria-hidden="true"><Drip color="var(--pink)" /></div>
      <Doodles className="opacity-60" />

      <div className="relative mx-auto max-w-[1240px] px-5 pt-20 md:px-8 md:pt-24">
        {/* Contact card: questions and big orders (different from the homepage's order button) */}
        {(contact.whatsapp || phone) && (
          <div className="flex flex-col items-start gap-5 rounded-[32px] bg-white p-6 shadow-lift md:p-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="font-[family-name:var(--font-script)] text-3xl text-pink-ink">Planning a party?</p>
              <h2 className="mt-1 font-display text-[clamp(1.3rem,2.4vw,1.8rem)] font-bold leading-[1.1]">Questions or a big order? Talk to us.</h2>
            </div>
            <div className="grid w-full gap-3 sm:flex sm:w-auto">
              {contact.whatsapp && (
                <a href={whatsappLink(contact.whatsapp, `Hi ${branding.store_name}! I have a question.`)} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-pink-ink px-6 font-semibold text-white transition hover:bg-[color-mix(in_srgb,var(--pink-ink),black_12%)] active:scale-[0.96]">
                  <BrandIcon label="WhatsApp" className="h-5 w-5" /> WhatsApp us
                </a>
              )}
              {phone && (
                <a href={`tel:${phone}`} className="inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-white px-6 font-semibold text-cocoa ring-1 ring-line transition hover:bg-pink-tint active:scale-[0.96]">
                  <Phone className="h-5 w-5" /> {prettyPhone(phone)}
                </a>
              )}
            </div>
          </div>
        )}

        <div className="mt-14 grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-[1.3fr_0.7fr_0.7fr_1.1fr]">
          <div className="col-span-2 space-y-4 lg:col-span-1">
            <LogoMark src={branding.logo_mark_url} className="h-24 w-32" />
            <p className="font-[family-name:var(--font-script)] text-2xl text-pink-ink">{branding.tagline}</p>
            <p className="max-w-xs text-[15px] leading-relaxed text-cocoa-muted">Donuts, cinnamon rolls, cookies and cookie tarts, made in our home kitchen and ready to order online.</p>
            <ul className="flex items-center gap-3" aria-label="Social media">
              {socialLinks.map(({ label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Follow Jordi Pastry on ${label}`}
                    title={label}
                    className="grid h-11 w-11 place-items-center rounded-full bg-white text-pink-ink shadow-cloud transition hover:-translate-y-0.5 hover:bg-pink-tint active:scale-[0.96]"
                  >
                    <BrandIcon label={label} className="h-[18px] w-[18px]" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {[["Shop", SHOP], ["Info", INFO]].map(([title, links]) => (
            <nav key={title as string} aria-label={`Footer ${title}`}>
              <h2 className="font-display text-xl font-bold">{title as string}</h2>
              <span className="mt-2 block h-[3px] w-8 rounded-full bg-accent" aria-hidden="true" />
              <ul className="mt-4 grid gap-2.5 text-[15px]">
                {(links as string[][]).map(([href, label]) => (
                  <li key={href}>
                    <Link href={href} className="group inline-flex items-center gap-0 transition-all hover:gap-2 hover:text-pink-ink">
                      <Heart className="h-3 w-0 opacity-0 transition-all duration-200 group-hover:w-3 group-hover:opacity-100 group-hover:fill-current" aria-hidden="true" />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div className="col-span-2 lg:col-span-1">
            <h2 className="font-display text-xl font-bold">Visit & contact</h2>
            <span className="mt-2 block h-[3px] w-8 rounded-full bg-accent" aria-hidden="true" />
            <ul className="mt-4 grid gap-3 text-[15px]">
              {contact.whatsapp && (
                <li><a href={whatsappLink(contact.whatsapp, `Hi ${branding.store_name}!`)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-pink-ink"><BrandChip label="WhatsApp" /> {prettyPhone(normalizeEgyptPhone(contact.whatsapp) ?? contact.whatsapp)}</a></li>
              )}
              {phone && <li><a href={`tel:${phone}`} className="flex items-center gap-3 hover:text-pink-ink"><Chip icon={Phone} /> {prettyPhone(phone)}</a></li>}
              <li><a href={`mailto:${email}`} className="flex items-center gap-3 break-all hover:text-pink-ink"><Chip icon={Mail} /> {email}</a></li>
              {contact.area && <li className="flex items-center gap-3"><Chip icon={MapPin} /> {contact.area}</li>}
              {contact.hours && <li className="flex items-start gap-3 whitespace-pre-line"><Chip icon={Clock} /> <span className="pt-1.5">{contact.hours}</span></li>}
            </ul>
          </div>
        </div>
      </div>

      <div className="relative mt-12 border-t border-cocoa/10 bg-[color-mix(in_srgb,var(--pink-soft),white_35%)]">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-3 px-5 py-5 text-sm text-cocoa-muted md:flex-row md:items-center md:justify-between md:px-8">
          <p>© {new Date().getFullYear()} {branding.store_name}. Baked with love in Egypt. Prices in EGP.</p>
          <div className="flex flex-wrap items-center gap-3">
            {store.instapay_enabled && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 font-semibold text-cocoa ring-1 ring-line"><CreditCard className="h-3.5 w-3.5 text-pink-ink" /> InstaPay accepted</span>
            )}
            <Link href="/privacy" className="hover:text-pink-ink">Privacy</Link>
            <Link href="/terms" className="hover:text-pink-ink">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
