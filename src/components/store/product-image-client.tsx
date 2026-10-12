"use client";
import Image from "next/image";
import { DonutArt, donutImage, glazeTint, isPhotoLook } from "@/components/brand/donut-art";

export function ProductImageClient({ name, flavor, url, className = "", contain = false }: { name: string; flavor: string | null; url: string | null; className?: string; contain?: boolean }) {
  const src = url ?? (isPhotoLook(name, flavor) ? donutImage(name, flavor) : null);
  return src ? (
    <span className={`relative block overflow-hidden ${className}`}>
      <Image
        src={src}
        alt={name}
        fill
        sizes="(max-width: 768px) 50vw, 320px"
        className={contain ? "object-contain" : "object-cover"}
      />
    </span>
  ) : (
    // Tint only where the caller draws a well (has a bg class); round thumbnails stay transparent.
    <span className={`grid place-items-center ${className}`} style={className.includes("bg-") ? { backgroundColor: glazeTint(name, flavor) } : undefined}>
      <DonutArt name={name} flavor={flavor} className="h-[82%] w-[82%]" />
    </span>
  );
}
