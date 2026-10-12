"use client";
import { useState } from "react";
import { Loader2, Star } from "lucide-react";
import { submitReview } from "@/app/(store)/order/actions";
import { inputClass } from "@/components/checkout/field";
import { btn } from "@/components/ui/button";

export function ReviewForm({ token, defaultName }: { token: string; defaultName: string }) {
  const [rating, setRating] = useState(0);
  const [name, setName] = useState(defaultName);
  const [body, setBody] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [error, setError] = useState("");

  if (state === "done") return <p className="rounded-2xl bg-good-tint px-5 py-4 font-semibold text-good" role="status">Thank you! Your review is now live on our homepage.</p>;

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!rating) { setError("Please choose a rating."); return; }
        setState("busy");
        const res = await submitReview({ token, name, rating, body });
        if (res.ok) setState("done");
        else { setState("idle"); setError(res.error); }
      }}
    >
      <fieldset>
        <legend className="font-semibold">Your rating</legend>
        <div className="mt-2 flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer rounded-full p-1">
              <input type="radio" name="rating" value={n} className="peer sr-only" checked={rating === n} onChange={() => setRating(n)} />
              <Star className={`h-9 w-9 transition peer-focus-visible:ring-2 ${n <= rating ? "fill-accent text-accent" : "text-line"}`} aria-hidden="true" />
              <span className="sr-only">{n} star{n > 1 ? "s" : ""}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-1.5">
        <label htmlFor="rv-name" className="font-semibold">Name to show</label>
        <input id="rv-name" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={40} required />
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="rv-body" className="font-semibold">Your review</label>
        <textarea id="rv-body" rows={3} className={inputClass} value={body} onChange={(e) => setBody(e.target.value)} maxLength={400} minLength={3} required />
      </div>
      {error && <p className="text-sm font-semibold text-bad" role="alert">{error}</p>}
      <button type="submit" disabled={state === "busy"} className={btn("primary", "md")}>{state === "busy" ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Send review</button>
    </form>
  );
}
