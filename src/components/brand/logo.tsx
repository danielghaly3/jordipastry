/* eslint-disable @next/next/no-img-element */
// An uploaded logo / mark from Website Editor → Branding replaces the defaults everywhere.

export function LogoMark({ className = "h-10 w-10", src }: { className?: string; src?: string }) {
  return <img src={src || "/images/brand/mark.webp"} alt="" aria-hidden="true" className={`object-contain ${className}`} />;
}

type Branding = { wordmark: string; descriptor: string; store_name: string; logo_url: string; logo_mark_url: string };

/** The default lockup keeps the brand name as crisp type at every size. */
export function Logo({ branding, full = false, className = "" }: { branding: Branding; full?: boolean; className?: string }) {
  if (branding.logo_url) {
    return (
      <img
        src={branding.logo_url}
        alt={branding.store_name}
        className={`w-auto object-contain ${full ? "h-36 md:h-44" : "h-10 sm:h-12"} ${className}`}
      />
    );
  }

  const name = branding.wordmark || branding.store_name || "JORDI";
  return (
    <span className={`inline-flex items-center ${full ? "flex-col" : "gap-2.5"} ${className}`} aria-label={branding.store_name}>
      <LogoMark
        src={branding.logo_mark_url}
        className={full ? "h-24 w-32 md:h-28 md:w-40" : "h-12 w-14 sm:h-14 sm:w-16"}
      />
      <span className={full ? "-mt-1 text-center" : "text-left"} aria-hidden="true">
        <span className={`block font-display font-semibold uppercase leading-[0.78] tracking-[0.13em] text-accent-ink ${full ? "text-5xl md:text-6xl" : "text-[1.65rem] sm:text-[1.9rem]"}`}>
          {name}
        </span>
        <span className={`block font-sans font-medium uppercase text-accent-ink ${full ? "mt-3 text-sm tracking-[0.48em]" : "mt-1 text-[8px] tracking-[0.42em] sm:text-[9px]"}`}>
          Pastry
        </span>
      </span>
    </span>
  );
}
