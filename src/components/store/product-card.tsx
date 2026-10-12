import Link from "next/link";
import { QuickAddButton } from "@/components/store/add-button";
import { Price } from "@/components/store/price";
import { ProductImage } from "@/components/store/product-image";
import { isAvailable, type Product } from "@/lib/types";

export function SampleTag() {
  return (
    <span className="shrink-0 rounded-full bg-warn-tint px-2 py-0.5 text-[11px] font-bold text-warn" title="Sample item for demonstration. Not a real menu item yet.">
      Sample
    </span>
  );
}

export function StockNote({ product }: { product: Product }) {
  if (!isAvailable(product)) return <span className="text-sm font-semibold text-bad">Sold out</span>;
  if (product.stock_quantity !== null && product.stock_quantity <= 5) return <span className="text-sm font-semibold text-accent-ink">Only {product.stock_quantity} left</span>;
  return <span className="text-sm font-medium text-good">Available</span>;
}

export function ProductCard({ product, priority = false, showArabic = true }: { product: Product; priority?: boolean; showArabic?: boolean }) {
  const available = isAvailable(product);
  return (
    <article className="@container group relative flex h-full flex-col rounded-[28px] bg-white p-3 shadow-cloud transition duration-300 hover:-translate-y-1 hover:shadow-lift">
      <Link href={`/menu/${product.slug}`} className="block rounded-[22px]" tabIndex={-1} aria-hidden="true">
        <ProductImage
          name={product.name}
          flavor={product.flavor}
          path={product.images[0]?.storage_path}
          alt={product.images[0]?.alt}
          preload={priority}
          muted={!available}
          className="aspect-square w-full rounded-[22px] bg-pink-tint transition duration-500 [&_svg]:transition-transform [&_svg]:duration-500 group-hover:[&_svg]:rotate-12 group-hover:[&_svg]:scale-105"
        />
      </Link>
      {!available && <span className="absolute left-6 top-6 rounded-full bg-cocoa px-3 py-1 text-xs font-bold text-cream">Sold out</span>}
      <div className="flex flex-1 flex-col px-2 pb-1 pt-3">
        <div className="flex flex-wrap-reverse items-start justify-between gap-x-2 gap-y-1">
          <h3 className="font-display text-xl font-semibold leading-tight">
            <Link href={`/menu/${product.slug}`} className="after:absolute after:inset-0 after:rounded-[28px] hover:text-pink-ink">{product.name}</Link>
          </h3>
          {product.is_sample && <SampleTag />}
        </div>
        {showArabic && product.name_ar && <p lang="ar" dir="rtl" className="mt-1 text-sm font-medium text-cocoa-muted">{product.name_ar}</p>}
        {product.description && <p className="mt-1 line-clamp-2 text-sm text-cocoa-muted">{product.description}</p>}
        <div className="mt-auto flex flex-col items-stretch gap-2 pt-4 @[230px]:flex-row @[230px]:items-center @[230px]:justify-between">
          <Price price={product.price} sale={product.sale_price} />
          <div className="relative z-10 [&>*]:w-full @[230px]:[&>*]:w-auto"><QuickAddButton product={product} /></div>
        </div>
      </div>
    </article>
  );
}
