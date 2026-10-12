"use client";
import Image from "next/image";
import { Star } from "lucide-react";
import { AutoRail } from "@/components/home/auto-rail";
import { Drip } from "@/components/home/drip";
import { ReviewCard } from "@/components/home/review-card";
import { ReviewDialog } from "@/components/home/review-dialog";
import type { Review } from "@/lib/types";

// "Love notes": real customer reviews, each in the card layout its writer picked, gliding past in a
// marquee (new reviews just join the loop; the section never grows). Homepage reviews publish instantly; order-page reviews carry a Verified badge.

const TILT = [-2, 1.5, -1, 2.5, -2.5, 1];

export function Testimonials({ reviews }: { reviews: Review[] }) {
  const n = reviews.length;
  const avg = n ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / n) * 10) / 10 : 0;

  return (
    <section className="relative z-10 overflow-x-clip bg-pink pb-6 pt-16 md:pb-8 md:pt-24" aria-labelledby="love-title">
      <div className="mx-auto max-w-[1240px] px-5 md:px-8">
        <div className="flex flex-col gap-6 text-white md:flex-row md:items-end md:justify-between">
          <div>
            <h2 id="love-title" className="font-display max-w-[16ch] text-[clamp(2rem,4.2vw,3.25rem)] font-bold leading-[1.1] tracking-[-0.02em]">
              {n ? "Love notes from our customers." : "Be our first love note."}
            </h2>
            {n > 0 ? (
              <div className="mt-5 inline-flex items-center gap-3 rounded-full bg-white/15 py-2 pl-3 pr-5 ring-1 ring-white/30">
                <Star className="h-6 w-6 fill-white text-white" aria-hidden="true" />
                <span className="font-display text-2xl font-semibold">{avg.toFixed(1)}</span>
                <span className="text-white/90">from {n} review{n === 1 ? "" : "s"}</span>
              </div>
            ) : (
              <p className="mt-5 max-w-md text-lg text-white/90">Tried our treats? Pick a card, write a few words, and you&apos;re on our wall.</p>
            )}
          </div>
          <div className="md:text-right">
            <p className="max-w-xs text-white/90 md:ml-auto">Write yours and pick the card it floats in.</p>
            <ReviewDialog />
          </div>
        </div>
      </div>

      {n === 0 ? (
          <div className="relative mx-auto mt-12 aspect-[4/3] w-[calc(100%-2.5rem)] max-w-[520px] rotate-2 overflow-hidden rounded-[36px] ring-8 ring-white/30">
            <Image src="/images/brand/flatlay.webp" alt="Jordi Pastry donuts" fill sizes="520px" className="object-cover" />
          </div>
        ) : (
          <AutoRail
            label="Customer reviews"
            speed={28}
            className="mt-4 items-start pb-8 pt-14"
            itemClassName="w-[290px] md:w-[340px]"
            items={reviews.map((review, i) => (
              // Float on the outer wrapper, tilt on the inner one, so the two transforms don't fight.
              <div key={review.id} className="animate-drift motion-reduce:animate-none" style={{ animationDelay: `${-(i * 1.3) % 7}s`, animationDuration: `${6 + (i % 4)}s` }}>
                <div style={{ rotate: `${TILT[i % TILT.length]}deg` }}>
                  <ReviewCard review={review} />
                </div>
              </div>
            ))}
          />
        )}
      <Drip className="absolute inset-x-0 top-full" />
    </section>
  );
}
