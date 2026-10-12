import Image from "next/image";
import { DonutArt, donutImage, glazeTint, isPhotoLook } from "@/components/brand/donut-art";
import { publicImageUrl } from "@/lib/env";

type Props = {
  name: string;
  flavor?: string | null;
  path?: string | null;
  alt?: string | null;
  sizes?: string;
  preload?: boolean;
  className?: string;
  muted?: boolean;
};

/** Product photo from Supabase Storage, or the generated donut placeholder until one is uploaded. */
export function ProductImage({ name, flavor, path, alt, sizes = "(max-width: 768px) 50vw, 25vw", preload, className = "", muted }: Props) {
  const filter = muted ? "grayscale-[0.7] opacity-60" : "";
  // Uploaded photo first; otherwise a brand photo for rolls/cookies/tart; otherwise the donut cutout.
  const src = path ? publicImageUrl("product-images", path) : isPhotoLook(name, flavor) ? donutImage(name, flavor) : null;
  if (src) {
    return (
      <span className={`relative block overflow-hidden ${className}`}>
        <Image src={src} alt={alt || name} fill sizes={sizes} preload={preload} className={`object-cover ${filter}`} />
      </span>
    );
  }
  return (
    <span className={`relative grid place-items-center ${className}`} style={{ backgroundColor: glazeTint(name, flavor) }}>
      <DonutArt name={name} flavor={flavor} className={`h-[82%] w-[82%] ${filter}`} />
    </span>
  );
}
