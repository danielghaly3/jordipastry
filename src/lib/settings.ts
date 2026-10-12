import { z } from "zod";

// Every editable setting lives in site_settings (one JSON document per key).
// Schemas here are the single source of truth for shape + defaults; writes are validated with the same schemas.

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const url = z.union([z.url({ protocol: /^https?$/ }).max(500), z.literal("")]).default("");

export const DEFAULT_SOCIAL_LINKS = {
  instagram: "https://www.instagram.com/jordipasrty",
  facebook: "https://www.facebook.com/profile.php?id=61586344850641",
  tiktok: "https://www.tiktok.com/@jordi.pastry",
} as const;
export const DEFAULT_CONTACT_EMAIL = "jordipasrty@gmail.com";

// Brand colors are limited to presets whose text colors pass WCAG AA (see DESIGN.md).
export const PALETTES = {
  rose: { label: "Jordi Rose", pink: "#C46B65", ink: "#A8524E", soft: "#F6D3CC", tint: "#FBE9E4" },
  jordi: { label: "Hot Pink", pink: "#EF4198", ink: "#C72474", soft: "#F7B4D4", tint: "#FFF0F7" },
  bubblegum: { label: "Bubblegum", pink: "#F36BB3", ink: "#C22F7E", soft: "#FAC6E2", tint: "#FFF2F8" },
  strawberry: { label: "Strawberry", pink: "#F2557A", ink: "#C8304F", soft: "#F9C0CD", tint: "#FFF1F4" },
  raspberry: { label: "Raspberry", pink: "#D81B60", ink: "#AD1457", soft: "#F48FB1", tint: "#FDECF3" },
} as const;
export const ACCENTS = {
  rosegold: { label: "Rose Gold", accent: "#B8754F", ink: "#94573A" },
  orange: { label: "Sweet Orange", accent: "#FF861C", ink: "#B54F00" },
  sunshine: { label: "Sunshine", accent: "#FFB020", ink: "#8F5400" },
  mint: { label: "Mint", accent: "#3CCB9A", ink: "#0F7A57" },
} as const;

export const HOME_SECTIONS = [
  { id: "marquee", label: "Rolling menu ribbon" },
  { id: "showcase", label: "Featured treats showcase" },
  { id: "bestsellers", label: "Best sellers" },
  { id: "flavors", label: "Explore our menu" },
  { id: "box", label: "Build your box" },
  { id: "why", label: "Why Jordi?" },
  { id: "fresh", label: "Testimonials (approved customer reviews)" },
  { id: "reviews", label: "(retired, merged into Testimonials)" },
  { id: "how", label: "How ordering works" },
  { id: "cta", label: "Final order banner" },
] as const;
export type HomeSectionId = (typeof HOME_SECTIONS)[number]["id"];
const sectionIds = HOME_SECTIONS.map((s) => s.id) as [HomeSectionId, ...HomeSectionId[]];

export const storeSchema = z.object({
  accepting_orders: z.boolean().default(true),
  closure_message: z.string().max(200).default("We're taking a short break and not accepting orders right now. Please check back soon!"),
  delivery_enabled: z.boolean().default(true),
  pickup_enabled: z.boolean().default(true),
  instapay_enabled: z.boolean().default(true),
  cash_enabled: z.boolean().default(false),
  custom_boxes_enabled: z.boolean().default(true),
  min_order_amount: z.number().min(0).max(100000).default(0),
  prep_time_text: z.string().max(80).default(""),
  scheduling_enabled: z.boolean().default(false),
  schedule_days_ahead: z.number().int().min(0).max(14).default(3),
  schedule_start: z.string().regex(HHMM).default("10:00"),
  schedule_end: z.string().regex(HHMM).default("21:00"),
  daily_order_capacity: z.number().int().min(1).max(10000).nullable().default(null),
  attention_after_hours: z.number().int().min(1).max(72).default(3),
  auto_cancel_unpaid_hours: z.number().int().min(0).max(168).default(24), // 0 = never
});

export const brandingSchema = z.object({
  store_name: z.string().min(1).max(60).default("Jordi Pastry"),
  wordmark: z.string().min(1).max(16).default("JORDI"),
  descriptor: z.string().max(20).default("PASTRY"),
  tagline: z.string().max(120).default("Baked with Love, Touched by Angels."),
  logo_url: url,
  logo_mark_url: url,
  favicon_url: url,
  palette: z.enum(Object.keys(PALETTES) as [keyof typeof PALETTES]).default("rose"),
  accent: z.enum(Object.keys(ACCENTS) as [keyof typeof ACCENTS]).default("rosegold"),
});

export const homepageSchema = z.object({
  hero_headline: z.string().min(1).max(60).default("A Little Bite of Heaven."),
  hero_description: z.string().max(160).default("Donuts, cinnamon rolls, cookies and cookie tarts, freshly made with love and a little touch of heaven."),
  hero_image_url: url,
  cta_primary: z.string().min(1).max(28).default("Order Now"),
  cta_secondary: z.string().min(1).max(28).default("Explore the Menu"),
  sections: z.array(z.object({ id: z.enum(sectionIds), visible: z.boolean() })).default(HOME_SECTIONS.map((s) => ({ id: s.id, visible: true }))),
});

export const aboutSchema = z.object({
  headline: z.string().min(1).max(80).default("Hello from Jordi Pastry"),
  short: z.string().max(240).default("A small, home-based donut and pastry kitchen in Egypt."),
  story: z.string().max(3000).default(""),
  image_url: url,
});

export const contactSchema = z.object({
  phone: z.string().max(30).default(""),
  whatsapp: z.string().max(30).default(""),
  email: z.union([z.email().max(120), z.literal("")]).default(DEFAULT_CONTACT_EMAIL),
  instagram: url.default(DEFAULT_SOCIAL_LINKS.instagram),
  facebook: url.default(DEFAULT_SOCIAL_LINKS.facebook),
  tiktok: url.default(DEFAULT_SOCIAL_LINKS.tiktok),
  area: z.string().max(120).default(""),
  hours: z.string().max(200).default(""),
});

export const announcementSchema = z.object({
  enabled: z.boolean().default(false),
  text: z.string().max(120).default("Fresh Treats Available Today!"),
});

// Private (read on the server only)
export const instapaySchema = z.object({
  recipient_name: z.string().max(80).default(""),
  identifier: z.string().max(80).default(""),
  instructions: z.string().max(500).default(""),
});
export const pickupSchema = z.object({
  instructions: z.string().max(500).default(""),
});

export const SETTINGS = {
  store: { schema: storeSchema, public: true },
  branding: { schema: brandingSchema, public: true },
  homepage: { schema: homepageSchema, public: true },
  about: { schema: aboutSchema, public: true },
  contact: { schema: contactSchema, public: true },
  announcement: { schema: announcementSchema, public: true },
  instapay: { schema: instapaySchema, public: false },
  pickup: { schema: pickupSchema, public: false },
} as const;

export type SettingsKey = keyof typeof SETTINGS;
export type SettingsValue<K extends SettingsKey> = z.infer<(typeof SETTINGS)[K]["schema"]>;
export type PublicSettings = { [K in "store" | "branding" | "homepage" | "about" | "contact" | "announcement"]: SettingsValue<K> };

/** Parse a stored value; anything malformed falls back to defaults so the site never breaks. */
export function readSetting<K extends SettingsKey>(key: K, value: unknown): SettingsValue<K> {
  const schema = SETTINGS[key].schema as unknown as z.ZodType<SettingsValue<K>>;
  const parsed = schema.safeParse(value ?? {});
  const data = parsed.success ? parsed.data : schema.parse({});
  if (key === "homepage") {
    // Keep every known section exactly once, in the saved order.
    const home = data as SettingsValue<"homepage">;
    const seen = new Set<string>();
    const sections = home.sections.filter((s) => !seen.has(s.id) && seen.add(s.id));
    for (const s of HOME_SECTIONS) if (!seen.has(s.id)) sections.push({ id: s.id, visible: true });
    return { ...home, sections } as SettingsValue<K>;
  }
  return data;
}
