-- Review cards: the customer picks a card layout and a menu-icon avatar (no photos are collected).
alter table public.reviews add column if not exists card_style text not null default 'classic'
  check (card_style in ('classic', 'spotlight', 'bubble', 'ribbon'));
alter table public.reviews add column if not exists treat text not null default 'donut'
  check (treat in ('donut', 'roll', 'cookie', 'tart'));

drop function if exists public.post_public_review(text, int, text, text);
create or replace function public.post_public_review(p_name text, p_rating int, p_body text, p_ip_hash text,
  p_card_style text default 'classic', p_treat text default 'donut')
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
begin
  if p_body ~* '(https?://|www\.)' then
    raise exception using message = 'NO_LINKS';
  end if;
  insert into reviews (display_name, rating, body, is_approved, approved_at, ip_hash, card_style, treat)
  values (trim(p_name), p_rating, trim(p_body), true, now(), p_ip_hash, p_card_style, p_treat)
  returning id into v_id;
  return v_id;
end $$;

revoke execute on function public.post_public_review(text, int, text, text, text, text) from public, anon, authenticated;
grant execute on function public.post_public_review(text, int, text, text, text, text) to service_role;
