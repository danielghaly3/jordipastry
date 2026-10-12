-- Security hardening from the 2026-10-12 audit.

-- 1. Rate limiter: serialize hits per key. Without the lock, many simultaneous requests could all
--    read a count under the limit and all be allowed.
create or replace function public.hit_rate_limit(p_key text, p_max int, p_window_seconds int)
returns boolean
language plpgsql security definer set search_path = public as $$
begin
  perform pg_advisory_xact_lock(hashtext('rate:' || p_key));
  delete from rate_limit_hits where key = p_key and created_at < now() - make_interval(secs => p_window_seconds);
  if random() < 0.02 then
    delete from rate_limit_hits where created_at < now() - interval '2 days';
  end if;
  if (select count(*) from rate_limit_hits where key = p_key) >= p_max then
    return false;
  end if;
  insert into rate_limit_hits (key) values (p_key);
  return true;
end $$;

revoke execute on function public.hit_rate_limit(text, int, int) from public, anon, authenticated;
grant execute on function public.hit_rate_limit(text, int, int) to service_role;

-- 2. Reviews: the public may read only what the homepage shows. ip_hash (a pseudonymous
--    fingerprint) and order_id are no longer readable with the public key. Admins keep order_id
--    for the order-number link; nobody reads ip_hash through the API.
revoke select on public.reviews from anon, authenticated;
grant select (id, display_name, rating, body, created_at, is_approved, verified, card_style, treat) on public.reviews to anon;
grant select (id, display_name, rating, body, created_at, is_approved, approved_at, verified, card_style, treat, order_id) on public.reviews to authenticated;
