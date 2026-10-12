import { BadgeCheck, CakeSlice, Cookie, Croissant, Donut, Quote, Star, type LucideIcon } from "lucide-react";
import { RATING_TITLES } from "@/lib/review-cards";
import type { Review } from "@/lib/types";

// One card family, four layouts (customer picks one). Same surface, radius, type and menu-medallion
// avatar everywhere; only the arrangement changes so the wall reads as a set.

export type CardReview = Pick<Review, "display_name" | "rating" | "body" | "verified" | "card_style" | "treat">;

const shell = "relative rounded-[24px] bg-cream p-6 shadow-lift";
const text = "whitespace-pre-line break-words text-[15px] leading-relaxed text-cocoa";

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5" role="img" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={`h-4 w-4 ${i < rating ? "fill-accent text-accent" : "fill-line text-line"}`} aria-hidden="true" />
      ))}
    </span>
  );
}

/** Same line icons as the menu-board medallions (categoryIcon in components/brand/ribbon). */
export const TREAT_ICONS: Record<string, LucideIcon> = { donut: Donut, roll: Croissant, cookie: Cookie, tart: CakeSlice };

/** Menu-board medallion: the treat's line icon in a white circle. */
function Medallion({ treat, className = "" }: { treat: string; className?: string }) {
  const Icon = TREAT_ICONS[treat] ?? Donut;
  return (
    <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white shadow-cloud ring-1 ring-line ${className}`} aria-hidden="true">
      <Icon className="h-7 w-7 text-pink" strokeWidth={1.5} />
    </span>
  );
}

const Tag = ({ verified }: { verified: boolean }) =>
  verified ? (
    <span className="inline-flex items-center gap-1 text-xs text-cocoa-muted"><BadgeCheck className="h-3.5 w-3.5 text-good" /> Verified order</span>
  ) : (
    <span className="text-xs text-cocoa-muted">Customer review</span>
  );

function Byline({ review }: { review: CardReview }) {
  return (
    <div className="flex items-center gap-3">
      <Medallion treat={review.treat} />
      <div className="min-w-0">
        <p className="truncate font-display text-base font-bold">{review.display_name}</p>
        <Stars rating={review.rating} />
      </div>
    </div>
  );
}

export function ReviewCard({ review }: { review: CardReview }) {
  switch (review.card_style) {
    case "spotlight":
      return (
        <article className={`${shell} mt-8 pt-11 text-center`}>
          <Medallion treat={review.treat} className="absolute -top-7 left-1/2 -translate-x-1/2" />
          <p className="font-display text-base font-bold uppercase tracking-[0.04em] text-pink-ink">{RATING_TITLES[review.rating]}</p>
          <span className="mt-2 flex justify-center"><Stars rating={review.rating} /></span>
          <p className={`${text} mt-3`}>&ldquo;{review.body}&rdquo;</p>
          <p className="mt-4 font-display text-base font-bold">{review.display_name}</p>
          <Tag verified={review.verified} />
        </article>
      );

    case "bubble":
      return (
        <article>
          <div className={shell}>
            <p className={`${text} italic`}>&ldquo;{review.body}&rdquo;</p>
            <span className="absolute -bottom-2.5 left-9 h-5 w-5 rotate-45 rounded-[3px] bg-cream" aria-hidden="true" />
          </div>
          <div className="mt-5 flex items-center gap-3 pl-3">
            <Medallion treat={review.treat} />
            <div className="min-w-0 text-white">
              <p className="truncate font-display text-base font-bold">{review.display_name}</p>
              <span className="text-xs text-white/85">{review.verified ? "Verified order" : "Customer review"} · {review.rating}/5 stars</span>
            </div>
          </div>
        </article>
      );

    case "ribbon":
      return (
        <article className={`${shell} pt-10`}>
          <span className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap bg-pink px-7 py-1.5 font-display text-xs font-bold uppercase tracking-[0.08em] text-white [clip-path:polygon(0_0,100%_0,calc(100%-10px)_50%,100%_100%,0_100%,10px_50%)]">
            {RATING_TITLES[review.rating]}
          </span>
          <Byline review={review} />
          <p className={`${text} mt-4`}>{review.body}</p>
          <div className="mt-4 border-t border-line pt-3"><Tag verified={review.verified} /></div>
        </article>
      );

    default: // classic
      return (
        <article className={shell}>
          <Quote className="absolute right-5 top-5 h-7 w-7 fill-pink-soft text-pink-soft" aria-hidden="true" />
          <Byline review={review} />
          <p className={`${text} mt-4`}>{review.body}</p>
          <div className="mt-4"><Tag verified={review.verified} /></div>
        </article>
      );
  }
}
