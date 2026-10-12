// Class helpers so Links and buttons share one button system (pill shape, press feedback, 48px targets).
const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-[transform,background-color,box-shadow,color] duration-200 active:scale-[0.96] disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none";

const variants = {
  primary: "bg-pink-ink text-white hover:bg-[color-mix(in_srgb,var(--pink-ink),black_12%)] shadow-cloud",
  secondary: "bg-white text-cocoa ring-1 ring-line hover:ring-pink-soft hover:bg-pink-tint",
  ghost: "text-cocoa hover:bg-pink-tint",
  dark: "bg-cocoa text-cream hover:bg-[color-mix(in_srgb,var(--cocoa),black_15%)]",
  danger: "bg-bad text-white hover:bg-[color-mix(in_srgb,var(--bad),black_12%)]",
  good: "bg-good text-white hover:bg-[color-mix(in_srgb,var(--good),black_12%)]",
} as const;

const sizes = {
  sm: "h-10 px-4 text-sm",
  md: "h-12 px-6 text-[15px]",
  lg: "h-14 px-7 text-base",
  icon: "h-11 w-11",
} as const;

export function btn(variant: keyof typeof variants = "primary", size: keyof typeof sizes = "md", extra = "") {
  return `${base} ${variants[variant]} ${sizes[size]} ${extra}`;
}
