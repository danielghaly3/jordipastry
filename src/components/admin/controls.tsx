"use client";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { btn } from "@/components/ui/button";
import { adminInput } from "@/components/admin/ui";

export function Toggle({ checked, onChange, label, description, disabled, id }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; description?: string; disabled?: boolean; id?: string;
}) {
  return (
    <label className={`flex cursor-pointer items-center justify-between gap-4 ${disabled ? "opacity-50" : ""}`}>
      <span>
        <span className="block font-semibold">{label}</span>
        {description && <span className="block text-sm text-cocoa-muted">{description}</span>}
      </span>
      <span className="relative inline-flex shrink-0">
        <input id={id} type="checkbox" role="switch" className="peer sr-only" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
        <span className="h-8 w-14 rounded-full bg-line transition peer-checked:bg-good peer-focus-visible:ring-2 peer-focus-visible:ring-pink-ink peer-focus-visible:ring-offset-2" />
        <span className="absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow transition peer-checked:translate-x-6" />
      </span>
    </label>
  );
}

type ConfirmProps = {
  trigger: (open: () => void) => React.ReactNode;
  title: string;
  body?: React.ReactNode;
  confirmLabel: string;
  tone?: "primary" | "danger" | "good";
  note?: { label: string; required?: boolean; placeholder?: string };
  check?: string; // a checkbox the owner must tick first
  onConfirm: (note: string) => Promise<boolean | void>;
};

/** Native <dialog> confirmation: focus trap, Esc to close, inert background for free. */
export function ConfirmDialog({ trigger, title, body, confirmLabel, tone = "primary", note, check, onConfirm }: ConfirmProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const [text, setText] = useState("");
  const [ticked, setTicked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const open = () => { setText(""); setTicked(false); setIsOpen(true); };
  useEffect(() => {
    const d = ref.current;
    if (isOpen && d && !d.open) d.showModal();
    if (!isOpen && d?.open) d.close();
  }, [isOpen]);
  const disabled = busy || (note?.required && !text.trim()) || (check && !ticked);

  return (
    <>
      {trigger(open)}
      <dialog ref={ref} onClose={() => setIsOpen(false)} onClick={(e) => e.target === e.currentTarget && setIsOpen(false)} className="m-auto w-[min(92vw,440px)] rounded-[24px] bg-white p-0 text-cocoa shadow-lift backdrop:bg-cocoa/40">
        <form
          method="dialog"
          className="p-6"
          onSubmit={async (e) => {
            e.preventDefault();
            if (disabled) return;
            setBusy(true);
            const result = await onConfirm(text.trim());
            setBusy(false);
            if (result !== false) setIsOpen(false);
          }}
        >
          <h2 className="text-xl font-bold">{title}</h2>
          {body && <div className="mt-2 text-cocoa-muted">{body}</div>}
          {note && (
            <label className="mt-4 grid gap-1.5">
              <span className="text-sm font-bold">{note.label}</span>
              <textarea className={adminInput} rows={3} maxLength={300} value={text} onChange={(e) => setText(e.target.value)} placeholder={note.placeholder} required={note.required} />
            </label>
          )}
          {check && (
            <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl bg-cream p-3">
              <input type="checkbox" className="mt-0.5 h-5 w-5 accent-[var(--good)]" checked={ticked} onChange={(e) => setTicked(e.target.checked)} />
              <span className="text-[15px] font-semibold">{check}</span>
            </label>
          )}
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" className={btn("secondary", "md")} onClick={() => setIsOpen(false)}>Go back</button>
            <button type="submit" disabled={!!disabled} className={btn(tone === "danger" ? "danger" : tone === "good" ? "good" : "primary", "md")}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} {confirmLabel}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
