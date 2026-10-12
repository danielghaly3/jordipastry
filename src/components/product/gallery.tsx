"use client";
import Image from "next/image";
import { useState } from "react";
import { DonutArt } from "@/components/brand/donut-art";
import { publicImageUrl } from "@/lib/env";
import type { Product } from "@/lib/types";

export function Gallery({ product, muted }: { product: Product; muted: boolean }) {
  const [i, setI] = useState(0);
  const images = product.images;
  const current = images[i];
  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-[40px] bg-pink-tint">
        <span className="absolute left-1/2 top-[8%] z-10 h-[6%] w-[36%] -translate-x-1/2 rounded-[50%] border-[5px] border-accent" aria-hidden="true" />
        {current ? (
          <Image src={publicImageUrl("product-images", current.storage_path)} alt={current.alt || product.name} fill preload sizes="(max-width: 1024px) 100vw, 600px" className={`object-cover ${muted ? "grayscale-[0.7] opacity-60" : ""}`} />
        ) : (
          <div className="absolute inset-[12%] animate-float-slow">
            <DonutArt name={product.name} flavor={product.flavor} className={`h-full w-full drop-shadow-[0_24px_30px_rgba(75,41,37,0.25)] ${muted ? "grayscale-[0.7] opacity-60" : ""}`} />
          </div>
        )}
      </div>
      {images.length > 1 && (
        <ul className="mt-4 flex gap-3">
          {images.map((img, idx) => (
            <li key={img.id}>
              <button type="button" onClick={() => setI(idx)} aria-label={`Show photo ${idx + 1}`} aria-current={idx === i} className={`relative h-20 w-20 overflow-hidden rounded-[20px] ${idx === i ? "ring-[3px] ring-pink-ink" : "ring-1 ring-line"}`}>
                <Image src={publicImageUrl("product-images", img.storage_path)} alt="" fill sizes="80px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {!current && <p className="mt-3 text-center text-sm text-cocoa-muted">Sample picture. Real photo coming soon.</p>}
    </div>
  );
}
