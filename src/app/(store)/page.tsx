import { Hero } from "@/components/home/hero";
import { FlavorMarquee } from "@/components/home/marquee";
import { OrderTimeline } from "@/components/home/order-timeline";
import { Showcase } from "@/components/home/showcase";
import { BestSellers, BoxTeaser, FinalCta, Flavors, SectionTitle, WhyJordi } from "@/components/home/sections";
import { Testimonials } from "@/components/home/testimonials";
import { getApprovedReviews, getBestSellers, getBoxSizes, getCategories, getProducts, getPublicSettings } from "@/lib/data";
import { publicImageUrl } from "@/lib/env";
import { spreadAcrossMenu } from "@/lib/menu-mix";
import { isAvailable } from "@/lib/types";

export default async function HomePage() {
  const [settings, products, categories, boxes, reviews] = await Promise.all([
    getPublicSettings(), getProducts(), getCategories(), getBoxSizes(), getApprovedReviews(),
  ]);
  const { homepage, store } = settings;

  // Featured first, then spread across categories so every strip shows the whole menu, not only donuts.
  const mix = spreadAcrossMenu([...products.filter((p) => p.is_featured), ...products.filter((p) => !p.is_featured)]);
  const showcase = mix.slice(0, 8);
  const best = await getBestSellers(products);
  const realBest = best.length >= 3;
  const picks = realBest ? best : spreadAcrossMenu([...mix].sort((a, b) => Number(isAvailable(b)) - Number(isAvailable(a)))).slice(0, 8);
  const activeBoxes = store.custom_boxes_enabled ? boxes.filter((b) => b.eligible.length > 0) : [];

  const heroDonuts = showcase.map((p) => ({
    name: p.name, flavor: p.flavor, image: p.images[0] ? publicImageUrl("product-images", p.images[0].storage_path) : null,
  }));

  const sections: Record<string, React.ReactNode> = {
    marquee: <FlavorMarquee products={mix} />,
    showcase: showcase.length > 0 && (
      <section className="mx-auto max-w-[1240px] px-5 py-12 md:px-8 md:py-16" aria-labelledby="showcase-title">
        <div id="showcase-title" className="mb-10"><SectionTitle title="Meet Today's Stars" sub="Tap a treat to take a closer look." /></div>
        <Showcase products={showcase} />
      </section>
    ),
    bestsellers: <BestSellers products={picks} real={realBest} />,
    flavors: <Flavors categories={categories} products={products} />,
    box: <BoxTeaser boxes={activeBoxes} products={products} />,
    why: <WhyJordi store={store} hasBoxes={activeBoxes.length > 0} />,
    // "fresh" slot now holds the testimonials; the old separate reviews block is merged into it.
    fresh: <Testimonials reviews={reviews} />,
    reviews: null,
    how: <OrderTimeline instapay={store.instapay_enabled} delivery={store.delivery_enabled} pickup={store.pickup_enabled} />,
    cta: <FinalCta cta={homepage.cta_primary} products={mix} />,
  };

  return (
    <>
      <Hero
        headline={homepage.hero_headline}
        description={homepage.hero_description}
        ctaPrimary={homepage.cta_primary}
        ctaSecondary={homepage.cta_secondary}
        heroImage={homepage.hero_image_url}
        donuts={heroDonuts}
        tagline={settings.branding.tagline}
      />
      {homepage.sections.filter((s) => s.visible).map((s) => <div key={s.id}>{sections[s.id]}</div>)}
    </>
  );
}
