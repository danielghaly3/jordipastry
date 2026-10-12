# Jordi Pastry: Design System

**Design read:** a playful consumer storefront for donut buyers in Egypt (mostly on mobile), plus a calm, mobile-first business tool for the owner. Language: bold pink canvas, white floating "cloud" surfaces, chunky rounded type, a recurring halo motif.

**Dials:** Storefront `VARIANCE 8 / MOTION 6 / DENSITY 4`. Admin `VARIANCE 3 / MOTION 3 / DENSITY 6`.

## Concept: "the bakery in the clouds"

- **Pink sky.** Jordi Pink is the big-surface color (hero panel, featured card, final CTA band). Never a thin accent.
- **Clouds.** Content sits on white or cream surfaces with very large radii, floating on a pink-tinted shadow.
- **Halo.** A thin orange ellipse is the brand's single decorative device. It appears in the logo, behind the featured donut, as the selected state in Build-a-Box, and on the active step of the order tracker. Use it at most once per viewport.
- **Sprinkles.** Small rounded capsules in pastel colors. Allowed only in the hero, the featured-donut card and the empty cart. Never as a page-wide background.

Principles borrowed from the reference library (`~/.claude/references/awesome-design-md`), not their branding:
- *Starbucks:* full-pill buttons with a `scale(.96)` press, plus a floating circular order button (here, the sticky mobile cart).
- *Airbnb:* one shadow tier. Depth comes from imagery and rounded clipping, not stacked elevations.
- *Shopify:* tinted tiny-shadow halos around key cards. The admin keeps to two canvas colors.

The `ui-ux-pro-max` search suggested "Liquid Glass" with Cormorant/Montserrat and stone/gold. **Overridden:** the brand brief specifies its own palette and a playful rounded voice, and luxury serif glass would erase it.

## Color tokens (`src/app/globals.css`)
Sampled from the official Jordi Pastry menu boards (2026-10-12). This replaced the first hot-pink/orange concept.

| Token | Hex | Use | Contrast |
|---|---|---|---|
| `--pink` (ribbon rose) | `#C46B65` | Ribbons, hero circle, big brand fills | White on it 3.72 (large/bold text only) |
| `--pink-ink` (deep rose) | `#A8524E` | Buttons (white label), links, active states | White on it 5.27 / on blush 4.90 |
| `--pink-soft` (blush) | `#F6D3CC` | Glaze drips, soft shapes, footer | Ink on it 11.17 |
| `--pink-tint` | `#FBE9E4` | Image wells, tinted panels | |
| `--accent` (rose gold) | `#B8754F` | Halo, wings, sparkles (decorative only) | 3.42 on blush: never body text |
| `--accent-ink` | `#94573A` | Rose-gold text if ever needed | 5.29 |
| `--cream` (blush paper) | `#FDF5F0` | Page canvas | |
| `--cocoa` (ink) | `#2B2220` | Headings and body text | 14.42 |
| `--cocoa-muted` | `#6E5652` | Secondary text | 6.26 |

The owner can switch brand colors only between **pre-validated presets** (Website Editor → Branding). "Jordi Rose" + "Rose Gold" are the defaults.

**Theme:** light only, deliberately. Blush paper and rose *are* the brand.

## Typography

- **Display:** Unbounded (400–700). Use it for headings, product names, prices, ribbons and nav. It is very wide, so heading sizes are about 20% smaller than for a serif, with tracking at -0.02em. Use medium weight for nav links.
- **Body/UI + Arabic:** IBM Plex Sans Arabic (400–700) for all body text, forms and admin. It also renders the Arabic menu names, so English and Arabic share one typeface.
- Tagline-style accents use Unbounded too; no third family.
- Prices: `EGP 45` in cards and checkout.

## Shape rule (one documented system)

- Buttons, inputs, chips, toggles, badges: **full pill**.
- Cards and panels: **28px** (`rounded-[28px]`). Hero/featured surfaces: **40px**.
- Image wells inside cards: **22px**.
- Admin: cards 20px, inputs 14px, buttons pill. The admin uses its own documented scale, consistent within itself.

## Elevation (one tier + a "lifted" state)

- `--shadow-cloud: 0 1px 2px rgb(75 41 37 / .06), 0 12px 32px -12px rgb(199 36 116 / .28)`
- Hover lift: `translateY(-4px)` plus the same shadow at slightly higher spread. Never black shadows.

## Motion (Motion for React, `motion/react`)

| Moment | Why it moves | Spec |
|---|---|---|
| Hero donuts float + pointer parallax | storytelling (the "floating" brand idea) | motion values only, spring `stiffness 120 / damping 20` |
| Featured donut switch | state transition | `layoutId` shared element, 450ms spring |
| Add to cart | feedback | button morphs to a check for 1.2s, cart badge bump |
| Cart drawer | state transition | slide from right, 300ms ease-out |
| Section reveal | hierarchy | `whileInView` fade-up 24px, once |
| Order success / box filled | feedback | halo ring scales in, sprinkles burst once |
| Hero headline | hierarchy | words rise in one after another (80ms stagger), once |
| Hero sky | storytelling | pink circle turns up to 45° and art drifts down as the hero scrolls away (`useScroll`) |
| Tagline badge | brand | tagline set around the logo mark, one turn per 22s |
| Halo sparkles | brand | three orange sparkles twinkle at the halo (hero only) |
| Flavor ribbon | breadth | the page's single marquee: real flavor names on a −1.5° pink-ink ribbon, pauses on hover |
| Add to cart | feedback | a mini donut arcs from the button into the header cart (`FlyLayer`) |
| Ordering steps | storytelling | the connecting line draws itself on scroll |

`prefers-reduced-motion`: every animation collapses to an instant state change (`MotionConfig reducedMotion="user"` plus CSS guards).

## Brand devices from the printed menu

- **Logo:** the official rose-gold winged-J emblem is `/images/brand/mark.webp`. The header and auth lockups pair it with live Cormorant Garamond and Montserrat type so the wordmark stays sharp and responsive. The footer uses the emblem without the JORDI word. An upload in Website Editor overrides the default lockup.
- **Ribbon:** white Playfair capitals on `--pink` with notched ends (`<Ribbon>`), under a white **medallion** with a line icon. Used for menu categories.
- **Menu board:** bilingual rows (English, dotted leader, price, dotted leader, Arabic) with a round thumbnail and Add button. Below 1024px, rows stack (English over Arabic, price at the right).
- **Line-art doodles:** Lucide icons (donut, leaf, heart, sparkle, croissant) in `--pink` at 25% opacity, hero only (`<Doodles>`).
- **Glaze drip:** blush drip along the top edge of every storefront page, and rose drip under the "Freshly made" band.
- **Brand photos:** `/images/brand/flatlay.webp` (real Jordi flat-lay) is the default About/"Freshly made" image. `/images/menu/*` hold roll, cookie and tart photos used as fallbacks until real per-item photos are uploaded.
- **Process timeline:** vertical, illustrated (receipt, phone, box, van, open box) in cocoa line-art with rose/blush fills. A donut rides the line with the scroll, and each step checks off and plays its own micro-animation.

## Creative devices (use exactly where listed)

- **Flavor-tinted wells:** placeholder donuts sit on a 16% tint of their own glaze color (`glazeTint`), and the featured card uses 28%. Real photos fill their wells.
- **Glaze drip:** only at the bottom of the pink "Freshly made" band, dripping over whatever section follows.
- **Max one marquee, one rotating badge, one drip per page.**

## Layout

- Container `max-w-[1240px]`, gutters `px-5 md:px-8`.
- Navigation: white floating bar with rounded *lower* corners, height 72px, one line at ≥1024px, hamburger below.
- Homepage section families (none repeats): split hero, featured carousel, scroll-snap rail, bento, interactive split, statement list, full-bleed pink band, quotes masonry, horizontal steps, CTA card.
- Mobile (<768px): everything collapses to a single column with explicit stacking. A sticky bottom cart button appears once the cart has items.

## Components

- **Button:** `primary` (pink-ink, white label), `secondary` (white, cocoa label, hairline), `ghost`. 48px min height, 44px min touch target everywhere.
- **Product card:** cream image well with the donut floating at 82% width, name (Playfair), short description (2 lines), price, availability, and an add button. A sold-out card desaturates its image and shows a "Sold out" pill.
- **Donut placeholder:** until the owner uploads photos, products render one of eleven matched, realistic top-down donut cutouts selected from the flavor name. Every image uses a centered 84% silhouette, transparent background, clean edges, exact flavor colors and the same soft top-left studio light; the component adds one consistent shadow. Always labeled as a sample picture in the admin.
- **Status pills:** fulfillment and payment pills use distinct shapes (payment has a currency icon) so the two tracks are never confused.

## Voice

Warm, short and concrete. Plain verbs ("Add to box", "Copy number"), and at most one 🍩 per message (only in Telegram/WhatsApp text, never as UI icons).
**No em-dashes in UI copy.**

## Mascot

**Jordi** is a plump, soft-3D angel donut derived from the logo mark: golden dough, glossy pink sprinkled glaze, a visible ring hole, simple cocoa face, two small white rounded-lobe wings and one thin orange halo. Lighting is always soft from the top-left, proportions stay fixed, backgrounds remain transparent and the UI supplies the shadow. Jordi appears only in calm empty or celebratory states: `hello` for the About fallback, `empty-box` for empty carts, `searching` for empty menu results and 404s, `celebrate` after placing an order, and `sleeping` when the store is closed. Because Jordi carries a halo, no second halo may appear in the same view.

## Verified facts vs. placeholders

Verified (from the brief): brand name JORDI PASTRY, tagline "Baked with Love, Touched by Angels.", home-based donut and pastry business in Egypt, EGP pricing, InstaPay manual transfers, delivery and pickup.

**Not provided, so never invented:** product photos, real prices, real menu, ingredients/allergens, reviews, business hours, address, phone numbers, social links, InstaPay details. Seeded products are flagged `is_sample` and labeled "Sample" on the storefront until the owner replaces them.

## Do / Don't

- Do keep one halo per viewport. Do keep pricing and buy buttons visible without hover on touch devices.
- Don't add glassmorphism, gradients on text, purple, stock photos of other brands' donuts, or fake testimonials.
