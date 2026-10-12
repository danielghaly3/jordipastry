import type { Metadata, Viewport } from "next";
import { Courgette, Fredoka, Nunito, Tajawal } from "next/font/google";
import { Toaster } from "sonner";
import { getPublicSettings } from "@/lib/data";
import { SITE_URL } from "@/lib/env";
import { ACCENTS, PALETTES } from "@/lib/settings";
import "./globals.css";

// Brand fonts: Fredoka for display, Nunito for body text (rounded, matches Fredoka), Tajawal for Arabic,
// Courgette (smooth, friendly connected script) for handwritten accent words.
// Fredoka and Nunito are variable fonts: one file covers every weight (smaller download than 4 static files).
const fredoka = Fredoka({ subsets: ["latin"], variable: "--font-fredoka" });
const courgette = Courgette({ subsets: ["latin"], variable: "--font-courgette", weight: "400" });
const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito" });
const tajawal = Tajawal({ subsets: ["arabic"], variable: "--font-tajawal", weight: ["400", "500", "700"] });

// Store pages are cached and served from the edge. Admin/checkout actions call revalidatePath
// whenever something customers see changes; this is only a safety net.
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const { branding, homepage } = await getPublicSettings();
  const description = `${branding.tagline} ${homepage.hero_description}`.trim();
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: `${branding.store_name}: ${homepage.hero_headline.replace(/\.$/, "")}`, template: `%s | ${branding.store_name}` },
    description,
    // Default icons come from app/icon.png + app/apple-icon.png (the Jordi app icon).
    icons: branding.favicon_url ? { icon: branding.favicon_url } : undefined,
    openGraph: { type: "website", siteName: branding.store_name, title: branding.store_name, description, locale: "en_EG" },
    twitter: { card: "summary_large_image", title: branding.store_name, description },
  };
}

export const viewport: Viewport = { themeColor: "#FDF5F0", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { branding } = await getPublicSettings();
  const p = PALETTES[branding.palette];
  const a = ACCENTS[branding.accent];
  const vars = {
    "--pink": p.pink, "--pink-ink": p.ink, "--pink-soft": p.soft, "--pink-tint": p.tint, "--accent": a.accent, "--accent-ink": a.ink,
  } as React.CSSProperties;

  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${fredoka.variable} ${nunito.variable} ${tajawal.variable} ${courgette.variable}`} style={vars}>
      <body className="min-h-dvh">
        {children}
        <Toaster position="top-center" richColors closeButton toastOptions={{ style: { fontFamily: "var(--font-sans)", borderRadius: 18 } }} />
      </body>
    </html>
  );
}
