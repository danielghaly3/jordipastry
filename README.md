# Jordi Pastry

Online shop and owner dashboard for **Jordi Pastry**, a home-based donut and pastry business in Egypt.

- **Storefront:** homepage, menu with filters and search, product pages, Build-a-Box, cart, guest checkout, InstaPay payment step, private order tracking.
- **Dashboard (`/admin`):** orders and payment verification, products, categories, boxes, analytics, website editor, store settings, Telegram notifications.

| Guide | For |
|---|---|
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Supabase, first admin account, Vercel, InstaPay configuration |
| [docs/TELEGRAM_SETUP.md](docs/TELEGRAM_SETUP.md) | New-order alerts in Telegram |
| [docs/OWNER_GUIDE.md](docs/OWNER_GUIDE.md) | Day-to-day guide for the shop owner |
| [DESIGN.md](DESIGN.md) | Design system: tokens, type, motion, rules |

## Stack

Next.js 16 (App Router, Server Actions) · TypeScript · Tailwind CSS 4 · Motion · Lucide · Recharts · Zod · Supabase (Postgres, Auth, Storage, RLS) · Vercel.

No paid services are required. Supabase and Vercel free tiers are enough for a small shop. WhatsApp uses plain `wa.me` links (no API). Telegram's Bot API is free.

## How it works

```
Browser ──► Next.js on Vercel ──► Supabase
             │  Server Actions validate input (Zod), rate-limit by hashed IP
             │  place_order() / report_payment()  ← SECURITY DEFINER, service role only
             │  admin pages use the owner's session  ← RLS + is_admin()
             └► Telegram Bot API (owner alerts, logged + retryable)
```

- **Prices are never trusted from the browser.** `place_order` (Postgres function, one transaction) recomputes every price, option, box surcharge, delivery fee and stock level from the database, then writes the order, items (price snapshots), payment record and status history. The cart's prices are display-only.
- **Idempotent checkout.** Each checkout has an `idempotency_key`. Double-clicks and network retries return the same order. Order numbers (`JP-000101`, …) come from a Postgres sequence, so they're safe under concurrency.
- **Payments.** InstaPay is manual. "I've Sent the Payment" only moves the status to *Payment Reported*; only the owner can mark it *Verified*. Revenue counts verified payments only. `payment_records` has `provider` / `provider_ref` columns, so a real gateway with webhooks can be added later without changing orders.
- **Customer privacy.** Order pages use a 64-hex random token, never the order ID. Receipts sit in a private bucket and are viewed through 10-minute signed URLs. Public RLS policies only expose the catalog and public settings.
- **Admin security.** No public sign-up path grants access: an account must also exist in `admin_profiles`. Every admin page and action re-checks on the server (`requireAdmin` / `getAdmin`), and Postgres enforces the same rule with RLS and `is_admin()`.
- **Abuse limits.** Orders are limited per hashed IP (6 per 10 minutes, 15 per day) and per phone number (3 per 15 minutes). InstaPay orders never paid are auto-cancelled after a configurable time (default 24 h), which releases reserved stock and daily capacity. Orders where the customer reported a payment are never auto-cancelled. Login and reset limits fail closed. Security headers include HSTS and a minimal CSP.
- **Telegram failures never block orders.** Alerts are sent after the response (`after()`), logged in `notification_logs` (unique per order and event, so there are no duplicates), and can be retried from the dashboard.
- **Content is editable.** Products, prices, boxes, delivery areas, InstaPay details, homepage text, sections, colors (pre-checked presets), logo and announcement all live in the database. Nothing needs a redeploy.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project (or a local Supabase)
npm run dev                  # http://localhost:3000
```

Apply the database first ([docs/DEPLOYMENT.md](docs/DEPLOYMENT.md), steps 1 to 3). With the Supabase CLI and Docker you can run everything locally: `supabase start`, then `supabase db reset` applies `supabase/migrations` and `supabase/seed.sql`.

## Checks

```bash
npm run check   # typecheck + lint + unit tests (phone numbers, Telegram messages, scheduling, bento layout)
npm run build
```

Database tests: run `supabase/tests/order_flow.test.sql` in the Supabase SQL editor (or with `psql`). It runs inside a transaction that is rolled back, so it's safe on a real project. It covers server-side pricing, ignored tampered prices, idempotency, price snapshots, stock reservation and restore on cancel, payment reporting, admin-only transitions, reviews, closed store, and RLS for anonymous and non-admin users. It prints `ALL DATABASE TESTS PASSED`.

## Project map

```
src/app/(store)/        storefront pages + customer server actions
src/app/admin/          login/reset + (dash)/ dashboard pages + actions/
src/app/api/cron/       unpaid-order reminder (Vercel Cron)
src/components/         brand, home, store, checkout, order, admin UI
src/lib/                data access, settings schemas, pricing helpers, phone/WhatsApp, Telegram, auth
supabase/migrations/    schema, functions, RLS + storage, stale-order cleanup (apply in order)
supabase/seed.sql       optional sample menu (flagged as sample)
supabase/tests/         SQL tests (transaction, rolled back)
```

## Known limits and next steps

- Images are resized and compressed in the browser before upload. There is no interactive crop tool; photos are center-cropped in square frames.
- Order tracking refreshes every 20 seconds (polling) rather than using realtime subscriptions, so no order data is ever readable through the public API key.
- New tables must enable RLS in their migration. Supabase grants new tables to `anon` and `authenticated` by default.
- On Vercel's Hobby plan, cron runs once a day. For hourly unpaid-order reminders and auto-cancel, upgrade or call `/api/cron/attention` from a free scheduler with the `Authorization: Bearer $CRON_SECRET` header.
- The Privacy and Terms pages describe what the system does. Have them reviewed for your business before launch.
