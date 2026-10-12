"use client";
import { Star } from "lucide-react";
import { AutoRail } from "@/components/home/auto-rail";
import { Drip } from "@/components/home/drip";
import { ReviewCard } from "@/components/home/review-card";
import { ReviewDialog } from "@/components/home/review-dialog";
import type { Review } from "@/lib/types";

// "Love notes": real customer reviews, each in the card layout its writer picked, gliding past in a
// marquee (new reviews just join the loop; the section never grows). Homepage reviews publish instantly; order-page reviews carry a Verified badge.

const TILT = [-2, 1.5, -1, 2.5, -2.5, 1];

const FEATURED_REVIEWS: Review[] = [
  { id: "featured-mariam", display_name: "Mariam Adel", rating: 5, body: "Honestly, some of the softest donuts I've ever had! The filling is delicious, and everything tastes so fresh. Definitely ordering again! 🍩💕", created_at: "", verified: false, card_style: "classic", treat: "donut" },
  { id: "featured-omar", display_name: "Omar Hassan", rating: 5, body: "You can really taste the quality in every bite. Not too sweet, perfectly fluffy, and the presentation is beautiful. Highly recommend!", created_at: "", verified: false, card_style: "spotlight", treat: "donut" },
  { id: "featured-nour", display_name: "Nour Ahmed", rating: 5, body: "I'm obsessed! The donuts look just as good as they taste. Such cute packaging too. Jordi Pastry is officially my new favourite! 💗", created_at: "", verified: false, card_style: "bubble", treat: "donut" },
  { id: "featured-youssef", display_name: "Youssef Khaled", rating: 5, body: "Ordered a box for my family and everyone loved it. Fresh, soft, and full of flavour. We finished the whole box in minutes!", created_at: "", verified: false, card_style: "ribbon", treat: "donut" },
  { id: "featured-farah", display_name: "Farah Mostafa", rating: 5, body: "Everything was made with so much care. The donuts were absolutely delicious, and the little details made the experience extra special. 🥹", created_at: "", verified: false, card_style: "classic", treat: "donut" },
];

export function Testimonials({ reviews }: { reviews: Review[] }) {
  const displayedReviews = reviews.length > 0 ? reviews : FEATURED_REVIEWS;
  const n = displayedReviews.length;
  const avg = Math.round((displayedReviews.reduce((s, r) => s + r.rating, 0) / n) * 10) / 10;

  return (
    <section className="relative z-10 overflow-x-clip bg-pink-ink pb-6 pt-16 md:pb-8 md:pt-24" aria-labelledby="love-title">
      <div className="mx-auto max-w-[1240px] px-5 md:px-8">
        <div className="flex flex-col gap-6 text-white md:flex-row md:items-end md:justify-between">
          <div>
            <h2 id="love-title" className="font-display max-w-[16ch] text-[clamp(2rem,4.2vw,3.25rem)] font-bold leading-[1.1] tracking-[-0.02em]">
              Love notes from our customers.
            </h2>
            {n > 0 && (
              <div className="mt-5 inline-flex items-center gap-3 rounded-full bg-cocoa/20 py-2 pl-3 pr-5 ring-1 ring-white/30">
                <Star className="h-6 w-6 fill-white text-white" aria-hidden="true" />
                <span className="font-display text-2xl font-semibold">{avg.toFixed(1)}</span>
                <span className="text-white">from {n} review{n === 1 ? "" : "s"}</span>
              </div>
            )}
          </div>
          <div className="md:text-right">
            <p className="max-w-xs text-white/90 md:ml-auto">Write yours and pick the card it floats in.</p>
            <ReviewDialog />
          </div>
        </div>
      </div>

      {displayedReviews.length > 0 && (
          <AutoRail
            label="Customer reviews"
            speed={28}
            className="mt-4 items-start pb-8 pt-14"
            itemClassName="w-[290px] md:w-[340px]"
            items={displayedReviews.map((review, i) => (
              // Float on the outer wrapper, tilt on the inner one, so the two transforms don't fight.
              <div key={review.id} className="animate-drift motion-reduce:animate-none" style={{ animationDelay: `${-(i * 1.3) % 7}s`, animationDuration: `${6 + (i % 4)}s` }}>
                <div style={{ rotate: `${TILT[i % TILT.length]}deg` }}>
                  <ReviewCard review={review} />
                </div>
              </div>
            ))}
          />
        )}
      <Drip className="absolute inset-x-0 top-full" color="var(--pink-ink)" />
    </section>
  );
}
