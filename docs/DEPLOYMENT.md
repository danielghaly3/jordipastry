# Deployment guide

About 30 minutes, start to finish. You need free accounts on [Supabase](https://supabase.com), [Vercel](https://vercel.com) and GitHub (or GitLab/Bitbucket).

## 1. Create the Supabase project

1. In Supabase, click **New project**. Pick the region closest to Egypt (e.g. *Frankfurt* or *Paris*) and save the database password somewhere safe.
2. Open **Project Settings → API Keys** and keep this tab open. You'll need:
   - the **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - the **Publishable key** (`sb_publishable_…`) → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - the **Secret key** (`sb_secret_…`) → `SUPABASE_SECRET_KEY` (server only: never share it or put it in front-end code)

   Older projects show `anon` and `service_role` keys instead. They work in the same two variables.

## 2. Create the database

Open **SQL Editor → New query** and run these files **in order**. Paste each one and click **Run**:

1. `supabase/migrations/20261011000100_schema.sql`
2. `supabase/migrations/20261011000200_functions.sql`
3. `supabase/migrations/20261011000300_security.sql` (RLS policies, grants and the three storage buckets)
4. `supabase/migrations/20261011000400_stale_orders.sql` (auto-cancel of unpaid InstaPay orders)
5. `supabase/migrations/20261011000500_arabic_names.sql` (Arabic product names)
6. `supabase/migrations/20261012000600_public_reviews.sql` (homepage reviews that publish instantly)
7. `supabase/migrations/20261012000700_review_cards.sql` (card design and treat avatar per review)
8. `supabase/seed.sql`: the real Jordi Pastry menu from the printed boards (26 items with Arabic names and EGP prices), box sizes priced at the menu price per donut, and the phone/WhatsApp numbers. The two delivery zones in it are placeholders to edit.

Then run `supabase/tests/order_flow.test.sql`. It should finish with `ALL DATABASE TESTS PASSED`, and it changes nothing (everything is rolled back).

Using the Supabase CLI instead: `supabase init` (keep the existing `supabase/` folders), `supabase link --project-ref <ref>`, `supabase db push`.

**Storage check:** in **Storage** you should now see `product-images` (public), `site-assets` (public) and `payment-receipts` (**private**). Don't make `payment-receipts` public.

## 3. Lock down sign-ups and set URLs

In **Authentication → Sign In / Providers** (labels differ slightly between dashboard versions):

- Turn **off** "Allow new users to sign up". The shop has no customer accounts.
- Keep **Email** enabled (used for the owner's login and password resets).

In **Authentication → URL Configuration**:

- **Site URL:** your website address, e.g. `https://jordipastry.com`
- **Redirect URLs:** add `https://jordipastry.com/auth/confirm` (and `http://localhost:3000/auth/confirm` for local development)

## 4. Create the owner's admin account

1. **Authentication → Users → Add user → Create new user.** Enter the owner's email and a strong password (12+ characters), and tick **Auto Confirm User**.
2. In the **SQL Editor**, give that account dashboard access:

```sql
insert into public.admin_profiles (user_id, display_name)
select id, 'Jordi'               -- the name shown in "Good morning, Jordi!"
from auth.users
where email = 'owner@example.com';
```

Only accounts listed in `admin_profiles` can open `/admin`. To remove access later: `delete from public.admin_profiles where user_id = '…';`

The owner can change their password any time with **Forgot your password?** on `/admin/login`.

**Recommended:** in **Authentication → Rate Limits**, keep the default sign-in limits. In **Authentication → Policies** (or Providers → Email), require passwords of at least 12 characters. The dashboard can do everything in the shop, so treat this login like a bank login.

## 5. Deploy to Vercel

1. Push this project to a Git repository.
2. In Vercel, click **Add New → Project** and import the repository. The framework is detected as Next.js.
3. Under **Environment Variables**, add everything from `.env.example`:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | from step 1 |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | from step 1 |
| `SUPABASE_SECRET_KEY` | from step 1 (mark as *Sensitive*) |
| `NEXT_PUBLIC_SITE_URL` | your final address, e.g. `https://jordipastry.com` (no trailing slash) |
| `CRON_SECRET` | a long random string (`openssl rand -hex 32`) |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | see [TELEGRAM_SETUP.md](TELEGRAM_SETUP.md) (can be added later) |

4. Click **Deploy**. To use your own domain, add it under **Settings → Domains**, then update `NEXT_PUBLIC_SITE_URL` and the Supabase URLs from step 3, and redeploy.

`vercel.json` schedules the daily job (`/api/cron/attention`). It sends unpaid-order reminders and auto-cancels InstaPay orders that were never paid after the hours set in **Store Settings → Inventory & capacity** (default 24, 0 = never), which releases their stock. It runs daily at 07:00 UTC (10:00 Cairo in summer, 09:00 in winter). Vercel sends `CRON_SECRET` automatically.

> Changing any `NEXT_PUBLIC_…` variable requires a redeploy, because those values are built into the site.

## 6. First-run checklist (in the dashboard)

1. Sign in at `https://your-site/admin/login`.
2. **Store Settings → Payment:** enter the InstaPay recipient name and InstaPay address/number (see below).
3. **Store Settings → Delivery:** add delivery areas and fees, or turn delivery off. Add pickup instructions.
4. **Website Editor → Footer & contact:** add WhatsApp, phone, Instagram and hours.
5. **Products:** the menu is already loaded. Upload a real photo for each item (until then, generic images are shown).
6. **Notifications:** connect Telegram and press **Send Test Notification**.
7. Place a test order from your phone, then confirm it in the dashboard to see the whole flow.

## InstaPay configuration

InstaPay has no public merchant API, so payments are verified by a person:

1. **Store Settings → Payment:** fill in the **Recipient name** exactly as InstaPay shows it, plus the **InstaPay address or number** customers should send to (e.g. `name@instapay` or a mobile number). Optional extra instructions appear under the payment details.
2. After ordering, each customer sees the exact amount, these details with copy buttons, and an **I've Sent the Payment** button (with an optional reference and receipt screenshot).
3. You get a Telegram alert. Open your **InstaPay app**, find the transfer, then tap **Confirm Payment** on the order. If you can't find it, tap **Reject Payment Report** and write why. The customer sees your reason and can try again.

The InstaPay details are stored as private settings: they're only shown on a customer's own payment page, never through the public API. Cash on delivery/pickup can be switched on in the same section.

## Backups and monitoring

- Supabase's free tier pauses projects after a week without any activity. A live shop with visitors stays awake.
- Download a backup now and then: **Database → Backups** (paid plans), or **Orders → Export CSV** in the dashboard.
- Server errors (never secrets or customer data) appear in **Vercel → Project → Logs**.
