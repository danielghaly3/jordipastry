import type { Metadata } from "next";
import Link from "next/link";
import { BoxBuilder } from "@/components/box/box-builder";
import { btn } from "@/components/ui/button";
import { getBoxSizes, getProducts, getPublicSettings } from "@/lib/data";

export const metadata: Metadata = { title: "Build a Box", description: "Choose a box size and fill it with your favorite donut flavors." };

export default async function BuildABoxPage({ searchParams }: { searchParams: Promise<{ size?: string }> }) {
  const [{ size }, boxes, products, settings] = await Promise.all([searchParams, getBoxSizes(), getProducts(), getPublicSettings()]);
  const usable = boxes.filter((b) => b.eligible.length > 0);

  return (
    <div className="mx-auto max-w-[1240px] px-5 pb-28 pt-10 md:px-8 md:pt-14">
      <h1 className="font-display text-[clamp(2rem,4.8vw,3.4rem)] font-bold leading-[1.1] tracking-[-0.02em]">
        Build Your <span className="text-pink-ink">Box</span>
      </h1>
      <p className="mt-3 max-w-xl text-lg text-cocoa-muted">Choose a size, then tap flavors to fill every slot.</p>
      {!settings.store.custom_boxes_enabled || usable.length === 0 ? (
        <div className="mt-12 rounded-[28px] bg-white p-10 text-center shadow-cloud">
          <p className="font-display text-2xl font-semibold">Custom boxes are taking a break</p>
          <p className="mt-2 text-cocoa-muted">You can still order your favorite treats one by one.</p>
          <Link href="/menu" className={btn("primary", "md", "mt-6")}>Browse the menu</Link>
        </div>
      ) : (
        <BoxBuilder boxes={usable} products={products} initialSize={size} />
      )}
    </div>
  );
}
