import { Cookie, CakeSlice, Croissant, Donut, Heart, Leaf, Sparkle, type LucideIcon } from "lucide-react";

/** The menu-board ribbon: white serif capitals on rose, with notched ends. */
export function Ribbon({ children, as: Tag = "h2", className = "", id }: { children: React.ReactNode; as?: "h2" | "h3" | "p"; className?: string; id?: string }) {
  return (
    <Tag
      id={id}
      className={`inline-block bg-pink px-10 py-2.5 font-display text-[clamp(1.25rem,2.8vw,2rem)] font-bold uppercase leading-none tracking-[0.06em] text-white [clip-path:polygon(0_0,100%_0,calc(100%-18px)_50%,100%_100%,0_100%,18px_50%)] md:px-14 ${className}`}
    >
      {children}
    </Tag>
  );
}

const ICONS: [RegExp, LucideIcon][] = [[/donut/i, Donut], [/roll|cinna/i, Croissant], [/tart|cake/i, CakeSlice], [/cookie/i, Cookie]];
export const categoryIcon = (slugOrName: string) => ICONS.find(([re]) => re.test(slugOrName))?.[1] ?? Sparkle;

/** Round medallion above a ribbon, like the icon circles on the printed menu. */
export function Medallion({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white shadow-cloud ring-1 ring-line md:h-20 md:w-20" aria-hidden="true">
      <Icon className="h-8 w-8 text-pink md:h-10 md:w-10" strokeWidth={1.5} />
    </span>
  );
}

/** Thin rose line-art scattered behind a section (decorative), echoing the menu-board doodles. */
export function Doodles({ className = "" }: { className?: string }) {
  const items: [LucideIcon, string][] = [
    [Donut, "left-[3%] top-[12%] h-16 w-16 -rotate-12"],
    [Leaf, "left-[14%] top-[62%] h-10 w-10 rotate-45"],
    [Heart, "right-[6%] top-[18%] h-8 w-8 rotate-12"],
    [Sparkle, "right-[18%] top-[70%] h-6 w-6"],
    [Sparkle, "left-[40%] top-[6%] h-5 w-5"],
    [Croissant, "right-[2%] bottom-[8%] h-14 w-14 -rotate-6"],
  ];
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      {items.map(([Icon, pos], i) => <Icon key={i} className={`absolute text-pink opacity-25 ${pos}`} strokeWidth={1.25} />)}
    </div>
  );
}
