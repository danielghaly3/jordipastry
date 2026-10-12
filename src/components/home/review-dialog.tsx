"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Heart, Loader2, PenLine, Send, Star, X } from "lucide-react";
import { postPublicReview } from "@/app/(store)/order/actions";
import { SprinkleBurst } from "@/components/order/celebrate";
import { ReviewCard, TREAT_ICONS } from "@/components/home/review-card";
import { CARD_STYLES, RATING_TITLES, TREATS, type CardStyle, type Treat } from "@/lib/review-cards";

const field = "w-full rounded-2xl bg-white px-4 py-3 text-base text-cocoa ring-1 ring-line placeholder:text-cocoa-muted/80 focus:outline-none focus:ring-2 focus:ring-pink-ink";

/** "Give us a review" button + popup with a live card preview. Posted reviews go live immediately; the page refreshes to show them. */
export function ReviewDialog({ onPosted }: { onPosted?: () => void }) {
  const router = useRouter();
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [trap, setTrap] = useState("");
  const [cardStyle, setCardStyle] = useState<CardStyle>("classic");
  const [treat, setTreat] = useState<Treat>("donut");
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [error, setError] = useState("");
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(closeTimer.current), []);
  useEffect(() => {
    const d = ref.current;
    if (open && d && !d.open) d.showModal();
    if (!open && d?.open) d.close();
  }, [open]);

  const start = () => { clearTimeout(closeTimer.current); setState("idle"); setError(""); setRating(0); setBody(""); setOpen(true); };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) return setError("Tap the stars to choose a rating.");
    setState("busy");
    setError("");
    const res = await postPublicReview({ name, rating, body, website: trap, cardStyle, treat });
    if (!res.ok) { setState("idle"); setError(res.error); return; }
    setState("done");
    onPosted?.();
    router.refresh();
    closeTimer.current = setTimeout(() => setOpen(false), 1800);
  };
  const shown = hover || rating;

  return (
    <>
      <button type="button" onClick={start} className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 font-semibold text-pink-ink shadow-cloud transition hover:bg-pink-tint active:scale-[0.96]">
        <PenLine className="h-4 w-4" /> Give us a review
      </button>
      <dialog
        ref={ref}
        onClose={() => setOpen(false)}
        onClick={(e) => {
          // Close only on a real backdrop click (outside the panel), not on the dialog's own scrollbar.
          if (e.target !== e.currentTarget) return;
          const r = e.currentTarget.getBoundingClientRect();
          if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) setOpen(false);
        }}
        aria-labelledby="review-dialog-title"
        className="m-auto max-h-[92dvh] w-[min(94vw,880px)] overflow-y-auto overscroll-contain rounded-[32px] text-left bg-cream p-0 text-cocoa shadow-lift backdrop:bg-cocoa/50 backdrop:backdrop-blur-[2px]"
      >
        <div className="relative p-6 md:p-8">
          <button type="button" onClick={() => setOpen(false)} className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white ring-1 ring-line hover:bg-pink-tint" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
          <AnimatePresence mode="wait" initial={false}>
            {state === "done" ? (
              <motion.div key="done" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative py-10 text-center" role="status">
                <span className="relative mx-auto grid h-20 w-20 place-items-center rounded-full bg-pink text-white">
                  <Heart className="h-9 w-9 fill-current" />
                  <SprinkleBurst count={16} distance={90} />
                </span>
                <p className="mt-6 font-display text-2xl font-bold">Thank you!</p>
                <p className="mt-2 text-cocoa-muted">Your review is live on our page.</p>
              </motion.div>
            ) : (
              <motion.form key="form" onSubmit={submit} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid gap-x-8 gap-y-5 md:grid-cols-[minmax(0,1fr)_320px]">
                <div className="grid content-start gap-5">
                <div className="pr-10">
                  <h2 id="review-dialog-title" className="font-display text-2xl font-bold">Leave a love note</h2>
                  <p className="mt-1 text-cocoa-muted">Tell us how your treats were, then dress up your card.</p>
                </div>
                <fieldset>
                  <legend className="mb-2 font-semibold">Your rating</legend>
                  <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <label key={n} className="cursor-pointer rounded-full p-1" onMouseEnter={() => setHover(n)}>
                        <input type="radio" name="rating" value={n} className="peer sr-only" checked={rating === n} onChange={() => setRating(n)} />
                        <motion.span className="block rounded-full peer-focus-visible:ring-2 peer-focus-visible:ring-pink-ink" animate={{ scale: n <= shown ? 1.12 : 1 }} transition={{ type: "spring", stiffness: 500, damping: 18 }}>
                          <Star className={`h-9 w-9 transition-colors ${n <= shown ? "fill-accent text-accent" : "text-line"}`} aria-hidden="true" />
                        </motion.span>
                        <span className="sr-only">{n} star{n > 1 ? "s" : ""}</span>
                      </label>
                    ))}
                    <span className="ml-2 text-sm font-semibold text-pink-ink" aria-live="polite">{RATING_TITLES[shown]}</span>
                  </div>
                </fieldset>
                <div className="grid gap-1.5">
                  <label htmlFor="rv-public-name" className="font-semibold">Your name</label>
                  <input id="rv-public-name" className={field} value={name} onChange={(e) => setName(e.target.value)} maxLength={40} required minLength={2} autoComplete="given-name" placeholder="e.g. Mariam S." />
                </div>
                <div className="grid gap-1.5">
                  <label htmlFor="rv-public-body" className="font-semibold">Your review</label>
                  <textarea id="rv-public-body" rows={4} className={field} value={body} onChange={(e) => setBody(e.target.value)} maxLength={400} required minLength={3} placeholder="What did you order? How was it?" />
                  <span className="text-right text-xs text-cocoa-muted">{body.length}/400</span>
                </div>
                <fieldset>
                  <legend className="mb-2 font-semibold">Pick your card</legend>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {CARD_STYLES.map((c) => (
                      <label key={c.id} className="cursor-pointer">
                        <input type="radio" name="card" value={c.id} className="peer sr-only" checked={cardStyle === c.id} onChange={() => setCardStyle(c.id)} />
                        <span className="block rounded-full bg-white py-2.5 text-center text-sm font-semibold ring-1 ring-line transition peer-checked:bg-pink-ink peer-checked:text-white peer-checked:ring-pink-ink peer-focus-visible:ring-2 peer-focus-visible:ring-pink-ink hover:bg-pink-tint peer-checked:hover:bg-pink-ink">{c.label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <fieldset>
                  <legend className="mb-2 font-semibold">Your favorite treat</legend>
                  <div className="flex flex-wrap gap-3">
                    {TREATS.map((t) => {
                      const Icon = TREAT_ICONS[t.id];
                      return (
                        <label key={t.id} className="cursor-pointer" title={t.label}>
                          <input type="radio" name="treat" value={t.id} className="peer sr-only" checked={treat === t.id} onChange={() => setTreat(t.id)} />
                          <span className="grid h-14 w-14 place-items-center rounded-full bg-white text-pink ring-1 ring-line transition hover:bg-pink-tint peer-checked:bg-pink peer-checked:text-white peer-checked:ring-pink peer-focus-visible:ring-[3px] peer-focus-visible:ring-pink-ink">
                            <Icon className="h-7 w-7" strokeWidth={1.5} aria-hidden="true" />
                          </span>
                          <span className="sr-only">{t.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
                {/* Honeypot for bots: hidden from people and screen readers */}
                <input type="text" tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} className="absolute -left-[9999px] h-px w-px opacity-0" aria-hidden="true" />
                </div>
                <div className="grid content-start gap-5">
                <div className="rounded-[28px] bg-pink-ink px-5 py-8 md:sticky md:top-0 md:mt-12">
                  <p className="mb-9 text-center text-xs font-bold uppercase tracking-[0.12em] text-white">Live preview</p>
                  <motion.div key={cardStyle} initial={{ opacity: 0, y: 10, rotate: -2 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ type: "spring", stiffness: 260, damping: 20 }}>
                    <ReviewCard review={{ display_name: name.trim() || "Your name", rating: rating || 5, body: body.trim() || "Your words will show here.", verified: false, card_style: cardStyle, treat }} />
                  </motion.div>
                </div>
                {error && <p className="rounded-2xl bg-bad-tint px-4 py-3 text-sm font-semibold text-bad" role="alert">{error}</p>}
                <button type="submit" disabled={state === "busy"} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-pink-ink font-semibold text-white transition hover:bg-[color-mix(in_srgb,var(--pink-ink),black_12%)] active:scale-[0.97] disabled:opacity-60">
                  {state === "busy" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-4 w-4" />} Post my review
                </button>
                <p className="text-center text-xs text-cocoa-muted">Your review shows right away on our homepage.</p>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </dialog>
    </>
  );
}
