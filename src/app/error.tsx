"use client";
import { btn } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="grid min-h-[70vh] place-items-center px-5 text-center">
      <div>
        <h1 className="font-display text-4xl font-bold">Something went wrong</h1>
        <p className="mt-3 text-cocoa-muted">Please try again. If it keeps happening, message us on WhatsApp.</p>
        <button type="button" onClick={reset} className={btn("primary", "md", "mt-6")}>Try again</button>
      </div>
    </main>
  );
}
