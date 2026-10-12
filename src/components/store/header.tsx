"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Menu, ShoppingBag, UserRound, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { cart, useCart } from "@/lib/cart/store";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Our Menu" },
  { href: "/build-a-box", label: "Boxes" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
];

type Branding = Parameters<typeof Logo>[0]["branding"];
type LiquidShape = { left: number; width: number };

export function Header({ branding }: { branding: Branding }) {
  const path = usePathname();
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [activeShape, setActiveShape] = useState<LiquidShape | null>(null);
  const [hoverShape, setHoverShape] = useState<LiquidShape | null>(null);
  const navList = useRef<HTMLUListElement>(null);
  const activeHref = LINKS.find((link) => link.href === "/" ? path === "/" : path.startsWith(link.href))?.href ?? "/";
  const active = (href: string) => href === activeHref;

  useEffect(() => {
    const list = navList.current;
    if (!list) return;
    const update = () => {
      const item = [...list.querySelectorAll<HTMLElement>("[data-nav-href]")].find((node) => node.dataset.navHref === activeHref);
      setActiveShape(item ? { left: item.offsetLeft, width: item.offsetWidth } : null);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(list);
    return () => observer.disconnect();
  }, [activeHref]);

  const enterNavItem = (href: string, element: HTMLElement) => {
    setHovered(href);
    setHoverShape({ left: element.offsetLeft, width: element.offsetWidth });
  };

  return (
    <header className="sticky top-3 z-40 mt-3 px-3 md:px-6">
      <div className="mx-auto max-w-[1240px] rounded-[34px] bg-white shadow-cloud md:rounded-[36px]">
        <nav className="relative z-10 flex h-[68px] items-center justify-between gap-4 px-4 md:h-[72px] md:px-8" aria-label="Main">
          <Link href="/" className="shrink-0 rounded-2xl" aria-label={`${branding.store_name} home`}>
            <Logo branding={branding} />
          </Link>

          <ul
            ref={navList}
            className="relative hidden items-center gap-1 lg:flex"
            onMouseLeave={() => { setHovered(null); setHoverShape(null); }}
          >
            <svg className="absolute h-0 w-0" aria-hidden="true">
              <defs>
                <filter id="nav-liquid" x="-35%" y="-80%" width="170%" height="260%" colorInterpolationFilters="sRGB">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
                  <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -10" result="goo" />
                  <feComposite in="SourceGraphic" in2="goo" operator="atop" />
                </filter>
              </defs>
            </svg>
            <span className="pointer-events-none absolute inset-0 z-0" style={{ filter: "url(#nav-liquid)" }} aria-hidden="true">
              {activeShape && (
                <motion.span
                  className="absolute top-1/2 h-10 -translate-y-1/2 rounded-full bg-pink-ink"
                  animate={{ left: activeShape.left, width: activeShape.width }}
                  transition={{ type: "spring", stiffness: 260, damping: 28 }}
                />
              )}
              {hoverShape && (
                <>
                  <motion.span
                    className="absolute top-1/2 h-10 -translate-y-1/2 rounded-full bg-pink-ink"
                    initial={false}
                    animate={{ left: hoverShape.left, width: hoverShape.width }}
                    transition={{ type: "spring", stiffness: 180, damping: 20, mass: 0.75 }}
                  />
                  <motion.span
                    className="absolute top-0 h-3 w-3 rounded-full bg-pink-ink"
                    initial={false}
                    animate={{ left: hoverShape.left + hoverShape.width / 2 - 6, y: [2, -2, 2] }}
                    transition={{ left: { type: "spring", stiffness: 150, damping: 18 }, y: { duration: 1.2, repeat: Infinity, ease: "easeInOut" } }}
                  />
                </>
              )}
            </span>
            {LINKS.map((l) => {
              const highlighted = hovered === l.href || (hovered === null && active(l.href));
              return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  data-nav-href={l.href}
                  aria-current={active(l.href) ? "page" : undefined}
                  onMouseEnter={(event) => enterNavItem(l.href, event.currentTarget)}
                  onFocus={(event) => enterNavItem(l.href, event.currentTarget)}
                  onBlur={() => { setHovered(null); setHoverShape(null); }}
                  className={`relative z-10 rounded-[18px] px-4 py-2.5 font-display text-[15px] font-medium transition duration-200 active:scale-[0.96] ${
                    highlighted ? "text-white" : "text-cocoa"
                  }`}
                >
                  {l.label}
                </Link>
              </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-1.5">
            <Link
              href="/admin/login"
              className="hidden h-12 w-12 lg:grid place-items-center rounded-full text-cocoa transition hover:bg-pink-tint active:scale-95"
              aria-label="Owner login"
              title="Owner login"
            >
              <UserRound className="h-6 w-6" strokeWidth={2} />
            </Link>
            <button
              type="button"
              onClick={() => cart.setOpen(true)}
              data-cart-target
              className="relative grid h-12 w-12 place-items-center rounded-full text-cocoa transition hover:bg-pink-tint active:scale-95"
              aria-label={`Open cart, ${count} item${count === 1 ? "" : "s"}`}
            >
              <ShoppingBag className="h-6 w-6" strokeWidth={2} />
              <AnimatePresence>
                {count > 0 && (
                  <motion.span
                    key={count}
                    initial={{ scale: 0.4 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 18 }}
                    className="absolute right-0.5 top-0.5 grid h-[22px] min-w-[22px] place-items-center rounded-full bg-accent px-1 text-xs font-bold text-cocoa"
                  >
                    {count}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
            <button
              type="button"
              className="grid h-12 w-12 place-items-center rounded-full text-cocoa hover:bg-pink-tint lg:hidden"
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </nav>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              id="mobile-menu"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 overflow-hidden lg:hidden"
            >
              <ul className="grid gap-1 px-4 pb-5">
                {LINKS.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      onClick={() => setOpen(false)}
                      aria-current={active(l.href) ? "page" : undefined}
                      className={`relative flex h-14 items-center overflow-hidden rounded-2xl px-4 font-display text-lg font-medium transition active:scale-[0.98] ${
                        active(l.href) ? "bg-pink-ink text-white shadow-cloud" : "text-cocoa hover:bg-pink-tint hover:text-pink-ink"
                      }`}
                    >
                      {l.label}
                      {active(l.href) && <span className="absolute inset-x-5 bottom-0 h-1 rounded-t-full bg-accent" aria-hidden="true" />}
                    </Link>
                  </li>
                ))}
                <li className="mt-1 border-t border-line pt-2">
                  <Link
                    href="/admin/login"
                    onClick={() => setOpen(false)}
                    className="flex h-12 items-center gap-3 rounded-2xl px-4 font-medium text-cocoa-muted transition hover:bg-pink-tint hover:text-pink-ink"
                  >
                    <UserRound className="h-5 w-5" /> Owner login
                  </Link>
                </li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
