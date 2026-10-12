-- Jordi Pastry: core schema
-- Money is numeric(10,2) in EGP. Order rows keep price/name snapshots so editing products never rewrites history.

create type public.fulfillment_status as enum ('received', 'preparing', 'ready', 'out_for_delivery', 'completed', 'canceled');
create type public.payment_status as enum ('pending', 'reported', 'verified', 'rejected', 'refunded');
create type public.fulfillment_method as enum ('delivery', 'pickup');
create type public.option_kind as enum ('variant', 'topping');

create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- Catalog ------------------------------------------------------------------

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  sort_order int not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null check (char_length(name) between 1 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  description text not null default '' check (char_length(description) <= 1000),
  price numeric(10,2) not null check (price >= 0),
  sale_price numeric(10,2) check (sale_price is null or (sale_price >= 0 and sale_price < price)),
  flavor text check (char_length(flavor) <= 60),
  ingredients text check (char_length(ingredients) <= 1000),
  allergens text[] not null default '{}',
  is_visible boolean not null default true,
  is_sold_out boolean not null default false,
  is_featured boolean not null default false,
  stock_quantity int check (stock_quantity >= 0), -- null = unlimited; 0 = unavailable
  box_surcharge numeric(10,2) not null default 0 check (box_surcharge >= 0), -- premium flavor surcharge per donut in a custom box
  sort_order int not null default 0,
  is_sample boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_category_idx on public.products (category_id);
create index products_listing_idx on public.products (sort_order) where archived_at is null;

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null,
  alt text check (char_length(alt) <= 160),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index product_images_product_idx on public.product_images (product_id, sort_order);

-- 'variant' options are pick-one (e.g. size), 'topping' options are pick-many.
create table public.product_options (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  kind public.option_kind not null,
  name text not null check (char_length(name) between 1 and 60),
  price_delta numeric(10,2) not null default 0 check (price_delta >= 0),
  is_available boolean not null default true,
  sort_order int not null default 0
);
create index product_options_product_idx on public.product_options (product_id, kind, sort_order);

create table public.box_sizes (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  description text not null default '' check (char_length(description) <= 300),
  slots int not null check (slots between 1 and 48),
  price numeric(10,2) not null check (price >= 0),
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.box_eligible_products (
  box_size_id uuid not null references public.box_sizes(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  primary key (box_size_id, product_id)
);
create index box_eligible_products_product_idx on public.box_eligible_products (product_id);

create table public.delivery_areas (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  fee numeric(10,2) not null default 0 check (fee >= 0),
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Editable content & settings. One JSON document per key, validated by zod in the app.
-- is_public=false keys (instapay, pickup) are only read server-side.
create table public.site_settings (
  key text primary key check (key ~ '^[a-z_]+$'),
  value jsonb not null default '{}',
  is_public boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid
);

-- Admins -------------------------------------------------------------------

create table public.admin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

-- Orders -------------------------------------------------------------------

create sequence public.order_number_seq start 101;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default ('JP-' || lpad(nextval('public.order_number_seq')::text, 6, '0')),
  -- unguessable token for the customer's payment + tracking pages (~244 random bits)
  public_token text not null unique default (replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')),
  idempotency_key uuid not null unique,
  customer_name text not null check (char_length(customer_name) between 2 and 80),
  customer_phone text not null check (customer_phone ~ '^\+201[0125][0-9]{8}$'),
  customer_whatsapp text not null check (customer_whatsapp ~ '^\+[0-9]{8,15}$'),
  fulfillment_method public.fulfillment_method not null,
  delivery_area_id uuid references public.delivery_areas(id) on delete set null,
  delivery_area_name text,
  delivery_address text check (char_length(delivery_address) <= 300),
  requested_for timestamptz,
  notes text check (char_length(notes) <= 500),
  subtotal numeric(10,2) not null check (subtotal >= 0),
  delivery_fee numeric(10,2) not null default 0 check (delivery_fee >= 0),
  total numeric(10,2) not null check (total >= 0),
  payment_method text not null default 'instapay' check (payment_method in ('instapay', 'cash')),
  payment_status public.payment_status not null default 'pending',
  fulfillment_status public.fulfillment_status not null default 'received',
  ip_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (fulfillment_method = 'pickup' or (delivery_address is not null and delivery_area_name is not null)),
  check (total = subtotal + delivery_fee)
);
create index orders_created_idx on public.orders (created_at desc);
create index orders_payment_status_idx on public.orders (payment_status);
create index orders_fulfillment_status_idx on public.orders (fulfillment_status);
create index orders_phone_idx on public.orders (customer_phone, created_at desc);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  kind text not null check (kind in ('product', 'box')),
  product_id uuid references public.products(id) on delete set null,
  box_size_id uuid references public.box_sizes(id) on delete set null,
  name text not null,
  unit_price numeric(10,2) not null check (unit_price >= 0),
  quantity int not null check (quantity between 1 and 99),
  line_total numeric(10,2) not null check (line_total >= 0),
  options jsonb not null default '[]',      -- [{id, kind, name, price_delta}]
  box_contents jsonb not null default '[]', -- [{product_id, name, quantity, surcharge}]
  created_at timestamptz not null default now()
);
create index order_items_order_idx on public.order_items (order_id);
create index order_items_product_idx on public.order_items (product_id);

-- One row per payment attempt. Today: a single manual InstaPay/cash record per order.
-- provider/provider_ref leave room for a gateway + verified webhooks later.
create table public.payment_records (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider text not null default 'instapay',
  provider_ref text,
  amount numeric(10,2) not null check (amount >= 0),
  status public.payment_status not null default 'pending',
  reference text check (char_length(reference) <= 120),
  receipt_path text,
  reported_at timestamptz,
  report_count int not null default 0,
  verified_at timestamptz,
  verified_by uuid,
  rejection_reason text check (char_length(rejection_reason) <= 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_ref)
);
create index payment_records_order_idx on public.payment_records (order_id, created_at desc);
create index payment_records_verified_idx on public.payment_records (verified_at) where status = 'verified';

create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  kind text not null check (kind in ('fulfillment', 'payment')),
  from_status text,
  to_status text not null,
  note text check (char_length(note) <= 300),
  actor text not null check (actor in ('customer', 'admin', 'system')),
  actor_id uuid,
  created_at timestamptz not null default now()
);
create index order_status_history_order_idx on public.order_status_history (order_id, created_at);

-- Telegram delivery log. unique(order_id, event) is the de-duplication guard.
create table public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete set null,
  event text not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'skipped')),
  attempts int not null default 0,
  last_error text,
  payload jsonb not null default '{}',
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_id, event)
);
create index notification_logs_status_idx on public.notification_logs (status, created_at desc);

-- Reviews can only be written from a completed order's tracking page and show after owner approval.
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  rating int not null check (rating between 1 and 5),
  body text not null check (char_length(body) between 3 and 400),
  is_approved boolean not null default false,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.rate_limit_hits (
  key text not null,
  created_at timestamptz not null default now()
);
create index rate_limit_hits_idx on public.rate_limit_hits (key, created_at);

-- updated_at triggers
create trigger categories_updated before update on public.categories for each row execute function public.set_updated_at();
create trigger products_updated before update on public.products for each row execute function public.set_updated_at();
create trigger box_sizes_updated before update on public.box_sizes for each row execute function public.set_updated_at();
create trigger site_settings_updated before update on public.site_settings for each row execute function public.set_updated_at();
create trigger orders_updated before update on public.orders for each row execute function public.set_updated_at();
create trigger payment_records_updated before update on public.payment_records for each row execute function public.set_updated_at();
create trigger notification_logs_updated before update on public.notification_logs for each row execute function public.set_updated_at();
