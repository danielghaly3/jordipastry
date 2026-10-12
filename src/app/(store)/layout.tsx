import { AnnouncementBar } from "@/components/store/announcement";
import { Drip } from "@/components/home/drip";
import { CartDrawer } from "@/components/store/cart-drawer";
import { FlyLayer } from "@/components/store/fly-layer";
import { Footer } from "@/components/store/footer";
import { Header } from "@/components/store/header";
import { MobileCartBar } from "@/components/store/mobile-cart-bar";
import { BackToTop } from "@/components/store/back-to-top";
import { Providers } from "@/components/store/providers";
import { getPublicSettings } from "@/lib/data";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const settings = await getPublicSettings();
  const closed = !settings.store.accepting_orders;
  return (
    <Providers>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-white focus:px-4 focus:py-2">
        Skip to content
      </a>
      {closed ? (
        <AnnouncementBar text={settings.store.closure_message} />
      ) : (
        settings.announcement.enabled && settings.announcement.text && <AnnouncementBar text={settings.announcement.text} />
      )}
      {/* Blush glaze dripping from the top edge, as on the printed menu boards */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-0 opacity-90" aria-hidden="true"><Drip color="var(--pink-soft)" /></div>
      <Header branding={settings.branding} />
      <main id="main" className="min-h-[60vh]">{children}</main>
      <Footer settings={settings} />
      <CartDrawer />
      <FlyLayer />
      <MobileCartBar />
      <BackToTop />
    </Providers>
  );
}
