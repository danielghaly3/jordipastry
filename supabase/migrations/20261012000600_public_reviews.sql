-- Public reviews: anyone can post from the homepage and it appears immediately (owner can hide/delete later).
-- Reviews linked to a completed order stay marked as verified.
alter table public.reviews alter column order_id drop not null;
alter table public.reviews add column if not exists verified boolean generated always as (order_id is not null) stored;
alter table public.reviews add column if not exists ip_hash text;

-- Order-page reviews now publish immediately as well.
create or replace function public.submit_review(p_token text, p_name text, p_rating int, p_body text)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_order orders%rowtype;
begin
  select * into v_order from orders where public_token = p_token;
  if not found then
    raise exception using message = 'ORDER_NOT_FOUND';
  end if;
  if v_order.fulfillment_status <> 'completed' then
    raise exception using message = 'INVALID_TRANSITION';
  end if;
  insert into reviews (order_id, display_name, rating, body, is_approved, approved_at)
  values (v_order.id, trim(p_name), p_rating, trim(p_body), true, now())
  on conflict (order_id) do nothing;
  if not found then
    raise exception using message = 'ALREADY_REVIEWED';
  end if;
end $$;

-- Homepage review (no order). Called only by the server after validation + rate limiting.
create or replace function public.post_public_review(p_name text, p_rating int, p_body text, p_ip_hash text)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
begin
  if p_body ~* '(https?://|www\.)' then
    raise exception using message = 'NO_LINKS';
  end if;
  insert into reviews (display_name, rating, body, is_approved, approved_at, ip_hash)
  values (trim(p_name), p_rating, trim(p_body), true, now(), p_ip_hash)
  returning id into v_id;
  return v_id;
end $$;

revoke execute on function public.post_public_review(text, int, text, text) from public, anon, authenticated;
grant execute on function public.post_public_review(text, int, text, text) to service_role;
