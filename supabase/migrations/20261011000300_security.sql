-- Jordi Pastry: Row Level Security, grants and storage.
-- Model: customers never authenticate. The browser (anon key) can only read the public catalog.
-- Orders and payments are written by SECURITY DEFINER functions that only the server (service role) may call.
-- Admins are authenticated users listed in admin_profiles.

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_options enable row level security;
alter table public.box_sizes enable row level security;
alter table public.box_eligible_products enable row level security;
alter table public.delivery_areas enable row level security;
alter table public.site_settings enable row level security;
alter table public.admin_profiles enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payment_records enable row level security;
alter table public.order_status_history enable row level security;
alter table public.notification_logs enable row level security;
alter table public.reviews enable row level security;
alter table public.rate_limit_hits enable row level security;

-- Grants: start from nothing, then open exactly what is needed.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;

grant select on public.categories, public.products, public.product_images, public.product_options,
  public.box_sizes, public.box_eligible_products, public.delivery_areas, public.site_settings, public.reviews
  to anon, authenticated;
grant insert, update, delete on public.categories, public.products, public.product_images, public.product_options,
  public.box_sizes, public.box_eligible_products, public.delivery_areas, public.site_settings
  to authenticated;
grant update, delete on public.reviews to authenticated;
-- Admins read orders; they change them only through admin_update_order (keeps totals tamper-proof).
grant select on public.orders, public.order_items, public.payment_records, public.order_status_history,
  public.notification_logs, public.admin_profiles to authenticated;

grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.store_flag(jsonb, text, boolean) to anon, authenticated;
grant execute on function public.best_seller_ids(int) to anon, authenticated;
grant execute on function public.admin_update_order(uuid, text, text) to authenticated;
grant execute on function public.admin_dashboard(int) to authenticated;
grant execute on function public.place_order(jsonb, boolean) to service_role;
grant execute on function public.report_payment(text, text, text) to service_role;
grant execute on function public.hit_rate_limit(text, int, int) to service_role;
grant execute on function public.submit_review(text, text, int, text) to service_role;

-- Public catalog ----------------------------------------------------------
create policy categories_public_read on public.categories for select to anon, authenticated
  using (is_visible);
create policy products_public_read on public.products for select to anon, authenticated
  using (is_visible and archived_at is null
         and (category_id is null or exists (select 1 from public.categories c where c.id = category_id and c.is_visible)));
-- These rely on the products/box_sizes policies above (RLS applies inside the subquery).
create policy product_images_public_read on public.product_images for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id));
create policy product_options_public_read on public.product_options for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id));
create policy box_sizes_public_read on public.box_sizes for select to anon, authenticated
  using (is_active);
create policy box_eligible_public_read on public.box_eligible_products for select to anon, authenticated
  using (exists (select 1 from public.box_sizes b where b.id = box_size_id)
         and exists (select 1 from public.products p where p.id = product_id));
create policy delivery_areas_public_read on public.delivery_areas for select to anon, authenticated
  using (is_active);
create policy site_settings_public_read on public.site_settings for select to anon, authenticated
  using (is_public);
create policy reviews_public_read on public.reviews for select to anon, authenticated
  using (is_approved);

-- Admin -------------------------------------------------------------------
create policy categories_admin on public.categories for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy products_admin on public.products for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy product_images_admin on public.product_images for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy product_options_admin on public.product_options for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy box_sizes_admin on public.box_sizes for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy box_eligible_admin on public.box_eligible_products for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy delivery_areas_admin on public.delivery_areas for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy site_settings_admin on public.site_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy reviews_admin on public.reviews for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy orders_admin_read on public.orders for select to authenticated using (public.is_admin());
create policy order_items_admin_read on public.order_items for select to authenticated using (public.is_admin());
create policy payment_records_admin_read on public.payment_records for select to authenticated using (public.is_admin());
create policy order_history_admin_read on public.order_status_history for select to authenticated using (public.is_admin());
create policy notification_logs_admin_read on public.notification_logs for select to authenticated using (public.is_admin());
create policy admin_profiles_self_read on public.admin_profiles for select to authenticated using (user_id = auth.uid());
-- rate_limit_hits: no policies (service role only).

-- Storage -----------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('product-images', 'product-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('site-assets', 'site-assets', true, 2097152, array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon']),
  ('payment-receipts', 'payment-receipts', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do nothing;

-- Public buckets are readable by URL without a policy. Only admins can write to them.
create policy jordi_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id in ('product-images', 'site-assets') and public.is_admin());
create policy jordi_admin_update on storage.objects for update to authenticated
  using (bucket_id in ('product-images', 'site-assets') and public.is_admin());
create policy jordi_admin_delete on storage.objects for delete to authenticated
  using (bucket_id in ('product-images', 'site-assets') and public.is_admin());
-- Receipts are private: customers upload through a short-lived signed URL issued by the server;
-- the owner views them through signed URLs created server-side.
create policy jordi_admin_read on storage.objects for select to authenticated
  using (bucket_id in ('product-images', 'site-assets', 'payment-receipts') and public.is_admin());
