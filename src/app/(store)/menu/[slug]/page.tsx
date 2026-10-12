import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { Gallery } from "@/components/product/gallery";
import { ProductBoxOptions } from "@/components/product/box-options";
import { Purchase } from "@/components/product/purchase";
import { Price } from "@/components/store/price";
import { ProductCard, SampleTag, StockNote } from "@/components/store/product-card";
import { getBoxSizes, getProductBySlug, getProducts, getPublicSettings } from "@/lib/data";
import { SITE_URL, publicImageUrl } from "@/lib/env";
import { whatsappLink } from "@/lib/phone";
import { effectivePrice, isAvailable } from "@/lib/types";

type Props = { params: Promise<{ slug: string }> };

// Pre-build every current item; items added later are built on first visit and then cached.
export async function generateStaticParams() {
  return (await getProducts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProductBySlug((await params).slug);
  if (!product) return { title: "Item not found" };
  const image = product.images[0] ? publicImageUrl("product-images", product.images[0].storage_path) : undefined;
  return {
    title: product.name,
    description: product.description || `${product.name} from Jordi Pastry.`,
    alternates: { canonical: `/menu/${product.slug}` },
    openGraph: { title: product.name, description: product.description, images: image ? [image] : undefined },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const [product, products, settings, boxes] = await Promise.all([getProductBySlug(slug), getProducts(), getPublicSettings(), getBoxSizes()]);
  if (!product) notFound();
  const available = isAvailable(product);
  const related = products.filter((p) => p.id !== product.id && p.category_id === product.category_id).slice(0, 4);
  const more = related.length >= 2 ? related : products.filter((p) => p.id !== product.id).slice(0, 4);
  const boxOptions = boxes
    .filter((box) => box.is_active && [3, 6, 12].includes(box.slots) && box.eligible.includes(product.id))
    .sort((a, b) => a.slots - b.slots);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images.map((i) => publicImageUrl("product-images", i.storage_path)),
    category: product.category?.name,
    brand: { "@type": "Brand", name: settings.branding.store_name },
    offers: {
      "@type": "Offer",
      price: effectivePrice(product).toFixed(2),
      priceCurrency: "EGP",
      availability: available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${SITE_URL}/menu/${product.slug}`,
    },
  };

  return (
    <div className="mx-auto max-w-[1240px] px-5 pt-8 md:px-8 md:pt-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Link href="/menu" className="inline-flex h-11 items-center gap-2 rounded-full px-1 font-semibold text-cocoa-muted hover:text-pink-ink">
        <ArrowLeft className="h-4 w-4" /> All donuts
      </Link>

      <div className="mt-4 grid gap-10 lg:grid-cols-2 lg:gap-16">
        <Gallery product={product} muted={!available} />

        <div>
          <div className="flex flex-wrap items-center gap-2">
            {product.category && (
              <Link href={`/menu?category=${product.category.slug}`} className="rounded-full bg-pink-tint px-3 py-1 text-sm font-bold text-accent-ink hover:bg-pink-soft">
                {product.category.name}
              </Link>
            )}
            {product.is_sample && <SampleTag />}
          </div>
          <h1 className="mt-3 font-display text-[clamp(1.9rem,4vw,3rem)] font-bold leading-[1.1] tracking-[-0.02em]">{product.name}</h1>
          {product.name_ar && <p lang="ar" dir="rtl" className="mt-1 text-right text-2xl text-cocoa-muted sm:text-left">{product.name_ar}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <Price price={product.price} sale={product.sale_price} className="text-3xl" />
            <StockNote product={product} />
          </div>
          {product.description && <p className="mt-5 max-w-prose text-lg leading-relaxed text-cocoa-muted">{product.description}</p>}
          {product.is_sample && (
            <p className="mt-4 rounded-2xl bg-warn-tint px-4 py-3 text-sm text-warn">
              This is a sample item used to preview the store. Its name and price are not final.
            </p>
          )}

          <div className="mt-8"><Purchase product={product} /></div>

          {available && settings.store.custom_boxes_enabled && boxOptions.length > 0 && <ProductBoxOptions product={product} boxes={boxOptions} />}

          <dl className="mt-10 space-y-5 border-t border-line pt-6">
            {product.ingredients && (
              <div>
                <dt className="font-display text-lg font-semibold">Ingredients</dt>
                <dd className="mt-1 whitespace-pre-line text-cocoa-muted">{product.ingredients}</dd>
              </div>
            )}
            {product.allergens.length > 0 && (
              <div>
                <dt className="font-display text-lg font-semibold">Allergens</dt>
                <dd className="mt-2 flex flex-wrap gap-2">
                  {product.allergens.map((a) => <span key={a} className="rounded-full bg-warn-tint px-3 py-1 text-sm font-semibold text-warn">{a}</span>)}
                </dd>
              </div>
            )}
            {!product.ingredients && product.allergens.length === 0 && (
              <div>
                <dt className="sr-only">Ingredients and allergens</dt>
                <dd className="text-cocoa-muted">
                Ingredient and allergen details haven&apos;t been added for this item yet.
                {settings.contact.whatsapp && (
                  <a href={whatsappLink(settings.contact.whatsapp, `Hi! Could you tell me the ingredients and allergens in ${product.name}?`)} target="_blank" rel="noopener noreferrer" className="ml-1 inline-flex items-center gap-1 font-semibold text-pink-ink hover:underline">
                    <MessageCircle className="h-4 w-4" /> Ask us on WhatsApp
                  </a>
                )}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {more.length > 0 && (
        <section className="mt-20" aria-labelledby="related-title">
          <h2 id="related-title" className="font-display text-3xl font-bold">You might also love</h2>
          <ul className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {more.map((p) => <li key={p.id}><ProductCard product={p} /></li>)}
          </ul>
        </section>
      )}
    </div>
  );
}
