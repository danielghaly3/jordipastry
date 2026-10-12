import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Mascot } from "@/components/brand/mascot";
import { btn } from "@/components/ui/button";
import { getPublicSettings } from "@/lib/data";

export async function generateMetadata(): Promise<Metadata> {
  const { about } = await getPublicSettings();
  return { title: "About Us", description: about.short };
}

export default async function AboutPage() {
  const { about, branding } = await getPublicSettings();
  return (
    <div className="mx-auto max-w-[1240px] px-5 pt-10 md:px-8 md:pt-14">
      <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <h1 className="font-display text-[clamp(2rem,4.8vw,3.4rem)] font-bold leading-[1.1] tracking-[-0.02em]">{about.headline}</h1>
          <p className="mt-5 max-w-xl text-xl leading-relaxed text-cocoa-muted">{about.short}</p>
          <p className="mt-4 font-[family-name:var(--font-script)] text-3xl text-pink-ink">{branding.tagline}</p>
        </div>
        <div className="relative mx-auto aspect-square w-full max-w-[460px]">
          {/* Default: the brand's own flat-lay photo, until the owner uploads an About photo */}
          <span className="relative block h-full w-full overflow-hidden rounded-[40px] shadow-lift ring-8 ring-white">
            <Image src={about.image_url || "/images/brand/flatlay.webp"} alt={`${branding.store_name} donuts`} fill sizes="460px" preload className="object-cover" />
          </span>
          <Mascot pose="hello" className="absolute -bottom-8 -left-8 h-32 w-32 md:h-40 md:w-40" />
        </div>
      </div>
      {about.story && (
        <section className="mx-auto mt-16 max-w-[68ch] rounded-[28px] bg-white p-7 shadow-cloud md:p-10">
          <h2 className="font-display text-3xl font-bold">Our story</h2>
          <div className="mt-4 whitespace-pre-line text-lg leading-relaxed">{about.story}</div>
        </section>
      )}
      <div className="mt-12 text-center">
        <Link href="/menu" className={btn("primary", "lg")}>See the menu</Link>
      </div>
    </div>
  );
}
