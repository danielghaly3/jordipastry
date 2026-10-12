-- Database tests for ordering, payments, admin actions and RLS.
-- Safe to run anywhere (including the Supabase SQL editor): everything happens in a transaction that is rolled back.
-- Any failure raises an exception; success prints 'ALL DATABASE TESTS PASSED'.
begin;

create temp table t (k text primary key, v text) on commit drop;
grant all on t to anon, authenticated;

create or replace function pg_temp.expect_error(p_sql text, p_code text) returns void language plpgsql as $$
begin
  execute p_sql;
  raise exception 'expected % but statement succeeded: %', p_code, p_sql using errcode = 'P0002';
exception
  when sqlstate 'P0002' then raise;
  when others then
    if sqlerrm <> p_code then
      raise exception 'expected % but got %: %', p_code, sqlerrm, p_sql;
    end if;
end $$;

create or replace function pg_temp.order_payload(p_key uuid, p_items jsonb, p_extra jsonb default '{}') returns jsonb language sql as $$
  select jsonb_build_object(
    'idempotency_key', p_key,
    'customer', jsonb_build_object('name', 'Test Customer', 'phone', '+201000000001', 'whatsapp', ''),
    'fulfillment_method', 'pickup',
    'payment_method', 'instapay',
    'items', p_items) || p_extra;
$$;

-- Fixtures ---------------------------------------------------------------
do $$
declare
  v_cat uuid; v_p1 uuid; v_p2 uuid; v_hidden uuid; v_box uuid; v_var uuid; v_top uuid; v_area uuid; v_admin uuid := gen_random_uuid();
begin
  delete from site_settings where key = 'store';
  insert into categories (name, slug) values ('Test Cat', 'zz-test-cat') returning id into v_cat;
  insert into products (category_id, name, slug, price, sale_price, box_surcharge) values (v_cat, 'Test Glazed', 'zz-test-glazed', 40, 35, 0) returning id into v_p1;
  insert into products (category_id, name, slug, price, box_surcharge, stock_quantity) values (v_cat, 'Test Pistachio', 'zz-test-pistachio', 60, 10, 5) returning id into v_p2;
  insert into products (category_id, name, slug, price, is_visible) values (v_cat, 'Test Hidden', 'zz-test-hidden', 10, false) returning id into v_hidden;
  insert into product_options (product_id, kind, name, price_delta) values (v_p1, 'variant', 'Large', 10) returning id into v_var;
  insert into product_options (product_id, kind, name, price_delta) values (v_p1, 'topping', 'Sprinkles', 5) returning id into v_top;
  insert into box_sizes (name, slots, price) values ('Test Box of 3', 3, 100) returning id into v_box;
  insert into box_eligible_products values (v_box, v_p1), (v_box, v_p2);
  insert into delivery_areas (name, fee) values ('Test Area', 25) returning id into v_area;
  insert into auth.users (id, email) values (v_admin, 'zz-admin@test.local');
  insert into admin_profiles (user_id) values (v_admin);
  insert into t values ('p1', v_p1), ('p2', v_p2), ('hidden', v_hidden), ('box', v_box), ('var', v_var), ('top', v_top), ('area', v_area), ('admin', v_admin);
end $$;

-- 1. Quote: server-side pricing (sale price + variant + topping; box + premium surcharge; delivery fee)
do $$
declare q jsonb;
begin
  q := place_order(pg_temp.order_payload(gen_random_uuid(), jsonb_build_array(
         jsonb_build_object('type', 'product', 'product_id', (select v from t where k = 'p1'), 'quantity', 2,
           'variant_id', (select v from t where k = 'var'), 'topping_ids', jsonb_build_array((select v from t where k = 'top')),
           'unit_price', 1),  -- a tampered client price must be ignored
         jsonb_build_object('type', 'box', 'box_size_id', (select v from t where k = 'box'), 'quantity', 1,
           'contents', jsonb_build_array(
             jsonb_build_object('product_id', (select v from t where k = 'p1'), 'quantity', 1),
             jsonb_build_object('product_id', (select v from t where k = 'p2'), 'quantity', 2)))),
         jsonb_build_object('fulfillment_method', 'delivery', 'delivery_area_id', (select v from t where k = 'area'))), true);
  -- (35 + 10 + 5) * 2 = 100 ; box 100 + 2*10 = 120 ; subtotal 220 ; fee 25
  assert (q ->> 'subtotal')::numeric = 220, 'quote subtotal ' || (q ->> 'subtotal');
  assert (q ->> 'delivery_fee')::numeric = 25, 'quote fee';
  assert (q ->> 'total')::numeric = 245, 'quote total';
  assert not exists (select 1 from orders where customer_phone = '+201000000001'), 'dry run must not write';
end $$;

-- 2. Place order + idempotency + snapshots + history
do $$
declare r jsonb; r2 jsonb; v_key uuid := gen_random_uuid(); o orders%rowtype;
begin
  r := place_order(pg_temp.order_payload(v_key, jsonb_build_array(
         jsonb_build_object('type', 'product', 'product_id', (select v from t where k = 'p1'), 'quantity', 1,
           'variant_id', (select v from t where k = 'var')))));
  assert r ->> 'order_number' ~ '^JP-[0-9]{6}$', 'order number format';
  assert length(r ->> 'token') = 64, 'token length';
  r2 := place_order(pg_temp.order_payload(v_key, '[]'::jsonb));
  assert (r2 ->> 'duplicate')::boolean and r2 ->> 'order_id' = r ->> 'order_id', 'idempotent retry returns same order';
  select * into o from orders where id = (r ->> 'order_id')::uuid;
  assert o.total = 45 and o.payment_status = 'pending' and o.fulfillment_status = 'received', 'order state';
  assert (select count(*) from order_status_history where order_id = o.id) = 2, 'initial history';
  assert (select amount from payment_records where order_id = o.id) = 45, 'payment record';
  update products set price = 99, sale_price = null where id = (select v from t where k = 'p1')::uuid;
  assert (select unit_price from order_items where order_id = o.id) = 45, 'price snapshot unchanged after edit';
  update products set price = 40, sale_price = 35 where id = (select v from t where k = 'p1')::uuid;
  insert into t values ('order', o.id), ('token', o.public_token);
end $$;

-- 3. Validation errors
select pg_temp.expect_error(format($q$ select place_order(pg_temp.order_payload(gen_random_uuid(), '[{"type":"product","product_id":"%s","quantity":1}]')) $q$, (select v from t where k = 'hidden')), 'ITEM_UNAVAILABLE');
select pg_temp.expect_error(format($q$ select place_order(pg_temp.order_payload(gen_random_uuid(), '[{"type":"product","product_id":"%s","quantity":1}]')) $q$, (select v from t where k = 'p1')), 'OPTION_UNAVAILABLE');
select pg_temp.expect_error(format($q$ select place_order(pg_temp.order_payload(gen_random_uuid(), '[{"type":"box","box_size_id":"%s","quantity":1,"contents":[{"product_id":"%s","quantity":2}]}]')) $q$, (select v from t where k = 'box'), (select v from t where k = 'p1')), 'BOX_INCOMPLETE');
select pg_temp.expect_error(format($q$ select place_order(pg_temp.order_payload(gen_random_uuid(), '[{"type":"box","box_size_id":"%s","quantity":1,"contents":[{"product_id":"%s","quantity":3}]}]')) $q$, (select v from t where k = 'box'), (select v from t where k = 'hidden')), 'ITEM_UNAVAILABLE');
select pg_temp.expect_error(format($q$ select place_order(pg_temp.order_payload(gen_random_uuid(), '[{"type":"product","product_id":"%s","quantity":1}]', '{"fulfillment_method":"delivery","delivery_area_id":"%s"}')) $q$, (select v from t where k = 'p2'), (select v from t where k = 'area')), 'ADDRESS_REQUIRED');
select pg_temp.expect_error($q$ select place_order(pg_temp.order_payload(gen_random_uuid(), '[]')) $q$, 'EMPTY_CART');

-- 4. Stock: reserve on order, block oversell, restore on cancel
do $$
declare r jsonb;
begin
  perform pg_temp.expect_error(format($q$ select place_order(pg_temp.order_payload(gen_random_uuid(), '[{"type":"product","product_id":"%s","quantity":6}]')) $q$, (select v from t where k = 'p2')), 'OUT_OF_STOCK');
  r := place_order(pg_temp.order_payload(gen_random_uuid(), jsonb_build_array(
         jsonb_build_object('type', 'product', 'product_id', (select v from t where k = 'p2'), 'quantity', 3),
         jsonb_build_object('type', 'box', 'box_size_id', (select v from t where k = 'box'), 'quantity', 1,
           'contents', jsonb_build_array(jsonb_build_object('product_id', (select v from t where k = 'p2'), 'quantity', 2),
                                         jsonb_build_object('product_id', (select v from t where k = 'p1'), 'quantity', 1))))));
  assert (select stock_quantity from products where id = (select v from t where k = 'p2')::uuid) = 0, 'stock reserved';
  perform pg_temp.expect_error(format($q$ select place_order(pg_temp.order_payload(gen_random_uuid(), '[{"type":"product","product_id":"%s","quantity":1}]')) $q$, (select v from t where k = 'p2')), 'ITEM_UNAVAILABLE');
  insert into t values ('stock_order', r ->> 'order_id');
end $$;

-- 5. Customer payment report never verifies
do $$
declare r jsonb;
begin
  r := report_payment((select v from t where k = 'token'), 'TX-123', null);
  assert (r ->> 'changed')::boolean and r ->> 'payment_status' = 'reported', 'reported';
  r := report_payment((select v from t where k = 'token'), 'TX-123', null);
  assert not (r ->> 'changed')::boolean, 'second report is a no-op (no duplicate alert)';
  assert (select payment_status from orders where id = (select v from t where k = 'order')::uuid) = 'reported', 'still unverified';
  perform pg_temp.expect_error(format($q$ select report_payment('%s', null, 'someone-else/x.png') $q$, (select v from t where k = 'token')), 'INVALID_RECEIPT');
end $$;

-- 6. Admin actions require an admin session
select pg_temp.expect_error(format($q$ select admin_update_order('%s', 'confirm_payment') $q$, (select v from t where k = 'order')), 'NOT_AUTHORIZED');
select set_config('request.jwt.claims', json_build_object('sub', (select v from t where k = 'admin'), 'role', 'authenticated')::text, true);
do $$
declare r jsonb; d jsonb;
begin
  perform pg_temp.expect_error(format($q$ select admin_update_order('%s', 'complete') $q$, (select v from t where k = 'order')), 'INVALID_TRANSITION');
  perform pg_temp.expect_error(format($q$ select admin_update_order('%s', 'reject_payment', ' ') $q$, (select v from t where k = 'order')), 'REASON_REQUIRED');
  r := admin_update_order((select v from t where k = 'order')::uuid, 'confirm_payment');
  assert r ->> 'payment_status' = 'verified', 'verified';
  assert (select verified_by from payment_records where order_id = (select v from t where k = 'order')::uuid) = (select v from t where k = 'admin')::uuid, 'verified_by recorded';
  perform admin_update_order((select v from t where k = 'order')::uuid, 'start_preparing');
  perform admin_update_order((select v from t where k = 'order')::uuid, 'mark_ready');
  perform pg_temp.expect_error(format($q$ select admin_update_order('%s', 'out_for_delivery') $q$, (select v from t where k = 'order')), 'INVALID_TRANSITION');
  r := admin_update_order((select v from t where k = 'order')::uuid, 'complete');
  assert r ->> 'fulfillment_status' = 'completed', 'completed';

  perform admin_update_order((select v from t where k = 'stock_order')::uuid, 'cancel');
  assert (select stock_quantity from products where id = (select v from t where k = 'p2')::uuid) = 5, 'stock restored on cancel';

  d := admin_dashboard(30);
  assert (d -> 'sales' ->> 'today')::numeric >= 45, 'verified sale counted today';
  assert (d -> 'summary' ->> 'awaiting_verification') is not null, 'summary present';
  assert jsonb_array_length(d -> 'orders_by_day') = 30, 'orders_by_day filled';
  assert jsonb_array_length(d -> 'revenue_by_month') = 12, 'revenue_by_month filled';
end $$;

-- 7. Reviews only for completed orders, once
select submit_review((select v from t where k = 'token'), 'Test', 5, 'Lovely donuts');
select pg_temp.expect_error(format($q$ select submit_review('%s', 'Test', 5, 'Again') $q$, (select v from t where k = 'token')), 'ALREADY_REVIEWED');

insert into reviews (display_name, rating, body, is_approved) values ('Hidden', 3, 'zz hidden', false);
select pg_temp.expect_error($q$ select post_public_review('Spam', 5, 'buy now at https://spam.example', null) $q$, 'NO_LINKS');
do $$ declare v uuid := post_public_review('Guest', 5, 'Lovely', null); begin assert (select verified and is_approved from reviews where id = v) is not true and (select is_approved from reviews where id = v), 'public review is live but unverified'; end $$;
do $$ declare v uuid := post_public_review('Card', 4, 'Nice', null, 'ribbon', 'cookie'); begin assert (select card_style = 'ribbon' and treat = 'cookie' from reviews where id = v), 'review keeps chosen card and treat'; end $$;
do $$ begin perform post_public_review('Card', 4, 'Nice', null, 'neon', 'donut'); raise exception 'unknown card style was accepted'; exception when check_violation then null; end $$;

-- 8. Store closed
insert into site_settings (key, value) values ('store', '{"accepting_orders": false}')
  on conflict (key) do update set value = excluded.value;
select pg_temp.expect_error(format($q$ select place_order(pg_temp.order_payload(gen_random_uuid(), '[{"type":"product","product_id":"%s","quantity":1}]')) $q$, (select v from t where k = 'p2')), 'STORE_CLOSED');

-- 9. RLS as an anonymous visitor
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;
do $$
begin
  assert not exists (select 1 from products where slug = 'zz-test-hidden'), 'hidden product invisible to public';
  assert exists (select 1 from products where slug = 'zz-test-glazed'), 'visible product readable';
  assert exists (select 1 from reviews where body = 'Lovely donuts'), 'order review visible immediately';
  assert not exists (select 1 from reviews where body = 'zz hidden'), 'hidden review invisible';
  assert not exists (select 1 from site_settings where not is_public), 'private settings invisible';
  perform pg_temp.expect_error('select count(*) from orders', 'permission denied for table orders');
  perform pg_temp.expect_error('select count(*) from payment_records', 'permission denied for table payment_records');
  perform pg_temp.expect_error($q$ select place_order('{}'::jsonb) $q$, 'permission denied for function place_order');
  perform pg_temp.expect_error($q$ select report_payment('x', null, null) $q$, 'permission denied for function report_payment');
  perform pg_temp.expect_error($q$ select post_public_review('x', 5, 'xyz', null, 'classic', 'donut') $q$, 'permission denied for function post_public_review');
  perform pg_temp.expect_error($q$ insert into products (name, slug, price) values ('x', 'x', 1) $q$, 'permission denied for table products');
  perform best_seller_ids(4);
end $$;
reset role;

-- 10. RLS as a logged-in user who is NOT an admin
select set_config('request.jwt.claims', json_build_object('sub', gen_random_uuid(), 'role', 'authenticated')::text, true);
set local role authenticated;
do $$
begin
  assert (select count(*) from orders) = 0, 'non-admin sees no orders';
  perform pg_temp.expect_error($q$ insert into categories (name, slug) values ('x', 'zz-x') $q$, 'new row violates row-level security policy for table "categories"');
  perform pg_temp.expect_error(format($q$ select admin_update_order('%s', 'cancel') $q$, (select v from t where k = 'order')), 'NOT_AUTHORIZED');
  perform pg_temp.expect_error($q$ select admin_dashboard(30) $q$, 'NOT_AUTHORIZED');
  perform pg_temp.expect_error($q$ update orders set total = 1 $q$, 'permission denied for table orders');
end $$;
reset role;

-- 11. Rate limiter
do $$
begin
  assert hit_rate_limit('zz-test', 2, 60) and hit_rate_limit('zz-test', 2, 60), 'first two allowed';
  assert not hit_rate_limit('zz-test', 2, 60), 'third blocked';
end $$;

-- 12. Auto-cancel of unpaid InstaPay orders (reported ones are left alone)
do $$
declare stale jsonb; reported jsonb; p2 uuid := (select v from t where k = 'p2')::uuid; canceled uuid[];
begin
  update site_settings set value = '{}' where key = 'store';
  stale := place_order(pg_temp.order_payload(gen_random_uuid(), jsonb_build_array(jsonb_build_object('type', 'product', 'product_id', p2, 'quantity', 2)),
    '{"customer":{"name":"Stale Test","phone":"+201000000002"}}'));
  reported := place_order(pg_temp.order_payload(gen_random_uuid(), jsonb_build_array(jsonb_build_object('type', 'product', 'product_id', p2, 'quantity', 1)),
    '{"customer":{"name":"Paid Test","phone":"+201000000003"}}'));
  perform report_payment(reported ->> 'token', 'REF', null);
  assert (select stock_quantity from products where id = p2) = 2, 'stock reserved by both orders';
  update orders set created_at = now() - interval '30 hours' where id in ((stale ->> 'order_id')::uuid, (reported ->> 'order_id')::uuid);
  canceled := array(select cancel_stale_orders(24));
  assert (stale ->> 'order_id')::uuid = any(canceled), 'stale unpaid order canceled';
  assert not ((reported ->> 'order_id')::uuid = any(canceled)), 'reported order left alone';
  assert (select stock_quantity from products where id = p2) = 4, 'stock released by auto-cancel';
  assert exists (select 1 from order_status_history where order_id = (stale ->> 'order_id')::uuid and actor = 'system' and to_status = 'canceled'), 'system history row';
end $$;

do $$ begin raise notice 'ALL DATABASE TESTS PASSED'; end $$;
rollback;
