import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic, Unbounded } from "next/font/google";
import { Toaster } from "sonner";
import { getPublicSettings } from "@/lib/data";
import { SITE_URL } from "@/lib/env";
import { ACCENTS, PALETTES } from "@/lib/settings";
import "./globals.css";

// Brand fonts: Unbounded for display, IBM Plex Sans Arabic for body text (covers Latin + Arabic).
const unbounded = Unbounded({ subsets: ["latin"], variable: "--font-unbounded", weight: ["400", "500", "600", "700"] });
const plexArabic = IBM_Plex_Sans_Arabic({ subsets: ["arabic", "latin"], variable: "--font-plex-arabic", weight: ["400", "500", "600", "700"] });

export const dynamic = "force-dynamic";

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
    <html lang="en" data-scroll-behavior="smooth" className={`${unbounded.variable} ${plexArabic.variable}`} style={vars}>
      <body className="min-h-dvh">
        {children}
        <Toaster position="top-center" richColors closeButton toastOptions={{ style: { fontFamily: "var(--font-sans)", borderRadius: 18 } }} />
      </body>
    </html>
  );
}
