import { Check } from "lucide-react";

const STEPS = ["Cart", "Details", "Payment", "Done"];

export function CheckoutSteps({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-2 text-sm font-semibold" aria-label="Checkout progress">
      {STEPS.map((s, i) => (
        <li key={s} className="flex items-center gap-2" aria-current={i === current ? "step" : undefined}>
          <span className={`grid h-7 w-7 place-items-center rounded-full text-xs ${i < current ? "bg-good text-white" : i === current ? "bg-pink-ink text-white" : "bg-white text-cocoa-muted ring-1 ring-line"}`}>
            {i < current ? <Check className="h-4 w-4" /> : i + 1}
          </span>
          <span className={`${i === current ? "text-cocoa" : "text-cocoa-muted"} ${i === current ? "" : "hidden sm:inline"}`}>{s}</span>
          {i < STEPS.length - 1 && <span className="h-0.5 w-5 rounded-full bg-line sm:w-8" aria-hidden="true" />}
        </li>
      ))}
    </ol>
  );
}
