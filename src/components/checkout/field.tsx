export const inputClass =
  "w-full rounded-2xl bg-white px-4 py-3 text-base text-cocoa ring-1 ring-line placeholder:text-cocoa-muted/80 focus:outline-none focus:ring-2 focus:ring-pink-ink aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-bad";

export function Field({ label, hint, error, children, id }: { label: string; hint?: string; error?: string; children: React.ReactNode; id: string }) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="font-semibold">{label}</label>
      {children}
      {hint && !error && <p id={`${id}-hint`} className="text-sm text-cocoa-muted">{hint}</p>}
      {error && <p id={`${id}-error`} className="text-sm font-semibold text-bad" role="alert">{error}</p>}
    </div>
  );
}
