"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  Bell, Boxes, ChartColumn, ClipboardList, Cookie, ExternalLink, House, LogOut, Menu as MenuIcon, Palette, Settings, Tags,
} from "lucide-react";
import { signOut } from "@/app/admin/auth-actions";
import { LogoMark } from "@/components/brand/logo";

const NAV = [
  { href: "/admin", label: "Overview", icon: House, group: "Run the shop" },
  { href: "/admin/orders", label: "Orders", icon: ClipboardList, group: "Run the shop" },
  { href: "/admin/products", label: "Products", icon: Cookie, group: "Menu" },
  { href: "/admin/categories", label: "Categories", icon: Tags, group: "Menu" },
  { href: "/admin/boxes", label: "Donut Boxes", icon: Boxes, group: "Menu" },
  { href: "/admin/analytics", label: "Analytics", icon: ChartColumn, group: "Run the shop" },
  { href: "/admin/website", label: "Website Editor", icon: Palette, group: "Setup" },
  { href: "/admin/settings", label: "Store Settings", icon: Settings, group: "Setup" },
  { href: "/admin/notifications", label: "Notifications", icon: Bell, group: "Setup" },
];
const GROUPS = ["Run the shop", "Menu", "Setup"];
const MOBILE = ["/admin", "/admin/orders", "/admin/products", "/admin/analytics"];

export function AdminShell({ children, storeName, attention, alerts }: { children: React.ReactNode; storeName: string; attention: number; alerts: number }) {
  const path = usePathname();
  const more = useRef<HTMLDialogElement>(null);
  const active = (href: string) => (href === "/admin" ? path === "/admin" : path.startsWith(href));
  useEffect(() => more.current?.close(), [path]);

  const Badge = ({ href }: { href: string }) => {
    const n = href === "/admin/orders" ? attention : href === "/admin/notifications" ? alerts : 0;
    return n > 0 ? <span className="ml-auto grid h-6 min-w-6 place-items-center rounded-full bg-accent px-1.5 text-xs font-bold text-cocoa">{n}</span> : null;
  };

  const links = (
    <nav aria-label="Dashboard" className="space-y-6">
      {GROUPS.map((g) => (
        <div key={g}>
          <p className="mb-2 px-3 text-xs font-bold text-cocoa-muted">{g}</p>
          <ul className="space-y-1">
            {NAV.filter((n) => n.group === g).map((n) => (
              <li key={n.href}>
                <Link href={n.href} aria-current={active(n.href) ? "page" : undefined} className={`flex h-12 items-center gap-3 rounded-[14px] px-3 font-semibold transition ${active(n.href) ? "bg-pink-tint text-pink-ink" : "text-cocoa hover:bg-cream"}`}>
                  <n.icon className="h-5 w-5" /> {n.label} <Badge href={n.href} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );

  const footer = (
    <div className="space-y-1 border-t border-line pt-4">
      <a href="/" target="_blank" className="flex h-11 items-center gap-3 rounded-[14px] px-3 font-semibold text-cocoa hover:bg-cream"><ExternalLink className="h-5 w-5" /> View website</a>
      <form action={signOut}>
        <button type="submit" className="flex h-11 w-full items-center gap-3 rounded-[14px] px-3 font-semibold text-cocoa hover:bg-cream"><LogOut className="h-5 w-5" /> Sign out</button>
      </form>
    </div>
  );

  return (
    <div className="min-h-dvh bg-[#fbf7f4] text-cocoa">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col gap-6 overflow-y-auto border-r border-line bg-white p-4 lg:flex">
        <Link href="/admin" className="flex items-center gap-2 px-2 pt-1"><LogoMark className="h-9 w-9" /><span className="font-display text-xl font-bold">{storeName}</span></Link>
        <div className="flex-1">{links}</div>
        {footer}
      </aside>

      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-white/95 px-4 backdrop-blur lg:hidden">
        <Link href="/admin" className="flex items-center gap-2"><LogoMark className="h-8 w-8" /><span className="font-display text-lg font-bold">{storeName}</span></Link>
        <a href="/" target="_blank" className="text-sm font-semibold text-pink-ink">View site</a>
      </header>

      <main className="px-4 pb-28 pt-5 md:px-8 md:pt-8 lg:ml-64 lg:pb-12">
        <div className="mx-auto max-w-[1180px]">{children}</div>
      </main>

      <nav aria-label="Dashboard shortcuts" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
        {NAV.filter((n) => MOBILE.includes(n.href)).map((n) => (
          <Link key={n.href} href={n.href} aria-current={active(n.href) ? "page" : undefined} className={`relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-bold ${active(n.href) ? "text-pink-ink" : "text-cocoa-muted"}`}>
            <n.icon className="h-6 w-6" /> {n.label}
            {n.href === "/admin/orders" && attention > 0 && <span className="absolute right-[18%] top-2 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[10px] text-cocoa">{attention}</span>}
          </Link>
        ))}
        <button type="button" onClick={() => more.current?.showModal()} className="flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-bold text-cocoa-muted">
          <MenuIcon className="h-6 w-6" /> More
        </button>
      </nav>

      <dialog ref={more} className="mb-0 mt-auto w-full max-w-none rounded-t-[28px] bg-white p-5 text-cocoa backdrop:bg-cocoa/40" onClick={(e) => e.target === more.current && more.current?.close()}>
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-line" aria-hidden="true" />
        {links}
        <div className="mt-4">{footer}</div>
      </dialog>
    </div>
  );
}
