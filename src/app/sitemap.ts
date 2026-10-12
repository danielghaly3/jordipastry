import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/data";
import { SITE_URL } from "@/lib/env";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getProducts().catch(() => []);
  const pages = ["", "/menu", "/build-a-box", "/about", "/contact", "/privacy", "/terms"].map((p) => ({ url: `${SITE_URL}${p}`, changeFrequency: "weekly" as const, priority: p ? 0.7 : 1 }));
  return [...pages, ...products.map((p) => ({ url: `${SITE_URL}/menu/${p.slug}`, changeFrequency: "weekly" as const, priority: 0.8 }))];
}
