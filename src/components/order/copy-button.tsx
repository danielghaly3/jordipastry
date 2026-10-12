"use client";
import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyButton({ value, label, className = "" }: { value: string; label: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
        } catch {
          const ta = Object.assign(document.createElement("textarea"), { value });
          document.body.append(ta);
          ta.select();
          document.execCommand("copy");
          ta.remove();
        }
        setDone(true);
        setTimeout(() => setDone(false), 1600);
      }}
      className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-white px-4 text-sm font-semibold text-cocoa ring-1 ring-line transition hover:bg-pink-tint active:scale-95 ${className}`}
      aria-label={done ? "Copied" : label}
    >
      {done ? <Check className="h-4 w-4 text-good" /> : <Copy className="h-4 w-4" />} {done ? "Copied" : "Copy"}
    </button>
  );
}
