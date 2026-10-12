import { formatEGP } from "@/lib/format";

export function Price({ price, sale, className = "text-xl" }: { price: number; sale: number | null; className?: string }) {
  return (
    <span className={`inline-flex items-baseline gap-2 font-display font-semibold ${className}`}>
      {sale !== null ? (
        <>
          <span className="text-accent-ink">{formatEGP(sale)}</span>
          <s className="text-[0.7em] font-medium text-cocoa-muted" aria-label={`was ${formatEGP(price)}`}>{formatEGP(price)}</s>
        </>
      ) : (
        <span>{formatEGP(price)}</span>
      )}
    </span>
  );
}
