-- Jordi Pastry: business logic that must be atomic or must never trust the browser.
-- Errors are raised with a stable MESSAGE code (e.g. 'STORE_CLOSED') and an optional DETAIL;
-- the app maps codes to friendly text (src/lib/errors.ts).

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admin_profiles where user_id = auth.uid());
$$;

create or replace function public.store_flag(p_store jsonb, p_key text, p_default boolean) returns boolean
language sql immutable as $$
  select coalesce((p_store ->> p_key)::boolean, p_default);
$$;

-- place_order -------------------------------------------------------------
-- Prices, fees, stock and availability are all computed here from the database.
-- p_dry_run = true returns a quote without writing anything (used by the checkout summary).
create or replace function public.place_order(p jsonb, p_dry_run boolean default false)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_store jsonb := coalesce((select value from site_settings where key = 'store'), '{}');
  v_existing record;
  v_item jsonb;
  v_c jsonb;
  v_lines jsonb := '[]';
  v_need jsonb := '{}';
  v_subtotal numeric(10,2) := 0;
  v_fee numeric(10,2) := 0;
  v_method fulfillment_method;
  v_area delivery_areas%rowtype;
  v_product record;
  v_box box_sizes%rowtype;
  v_qty int;
  v_cqty int;
  v_unit numeric(10,2);
  v_delta numeric(10,2);
  v_opts jsonb;
  v_opt jsonb;
  v_contents jsonb;
  v_slots int;
  v_cnt int;
  v_order record;
  v_payment text := coalesce(p ->> 'payment_method', 'instapay');
  v_requested timestamptz;
  v_cap int;
  v_key text;
  v_val int;
  v_stock int;
  v_name text;
  v_address text := nullif(trim(p ->> 'delivery_address'), '');
begin
  if not p_dry_run then
    -- Serialize checkouts so idempotency, stock and daily capacity checks cannot race.
    perform pg_advisory_xact_lock(hashtext('jordi.place_order'));
    select id, order_number, public_token, total into v_existing
      from orders where idempotency_key = (p ->> 'idempotency_key')::uuid;
    if found then
      return jsonb_build_object('order_id', v_existing.id, 'order_number', v_existing.order_number,
        'token', v_existing.public_token, 'total', v_existing.total, 'duplicate', true);
    end if;
  end if;

  if not store_flag(v_store, 'accepting_orders', true) then
    raise exception using message = 'STORE_CLOSED';
  end if;

  if jsonb_typeof(p -> 'items') is distinct from 'array' or jsonb_array_length(p -> 'items') = 0 then
    raise exception using message = 'EMPTY_CART';
  end if;
  if jsonb_array_length(p -> 'items') > 30 then
    raise exception using message = 'TOO_MANY_ITEMS';
  end if;

  for v_item in select * from jsonb_array_elements(p -> 'items') loop
    v_qty := (v_item ->> 'quantity')::int;
    if v_qty is null or v_qty < 1 or v_qty > 20 then
      raise exception using message = 'INVALID_QUANTITY';
    end if;

    if v_item ->> 'type' = 'product' then
      select pr.* into v_product
        from products pr left join categories c on c.id = pr.category_id
       where pr.id = (v_item ->> 'product_id')::uuid
         and pr.archived_at is null and pr.is_visible and not pr.is_sold_out
         and (pr.stock_quantity is null or pr.stock_quantity > 0)
         and (c.id is null or c.is_visible);
      if not found then
        select name into v_name from products where id = (v_item ->> 'product_id')::uuid;
        raise exception using message = 'ITEM_UNAVAILABLE', detail = coalesce(v_name, '');
      end if;

      v_unit := coalesce(v_product.sale_price, v_product.price);
      v_opts := '[]';

      -- A product with available variants requires exactly one of them.
      select count(*) into v_cnt from product_options
       where product_id = v_product.id and kind = 'variant' and is_available;
      if v_cnt > 0 then
        select jsonb_build_object('id', o.id, 'kind', o.kind, 'name', o.name, 'price_delta', o.price_delta), o.price_delta
          into v_opt, v_delta
          from product_options o
         where o.id = nullif(v_item ->> 'variant_id', '')::uuid and o.product_id = v_product.id
           and o.kind = 'variant' and o.is_available;
        if not found then
          raise exception using message = 'OPTION_UNAVAILABLE', detail = v_product.name;
        end if;
        v_opts := v_opts || jsonb_build_array(v_opt);
        v_unit := v_unit + v_delta;
      end if;

      if jsonb_typeof(v_item -> 'topping_ids') = 'array' and jsonb_array_length(v_item -> 'topping_ids') > 0 then
        select count(*), coalesce(sum(o.price_delta), 0),
               coalesce(jsonb_agg(jsonb_build_object('id', o.id, 'kind', o.kind, 'name', o.name, 'price_delta', o.price_delta) order by o.sort_order), '[]')
          into v_cnt, v_delta, v_opt
          from product_options o
         where o.product_id = v_product.id and o.kind = 'topping' and o.is_available
           and o.id in (select x::uuid from jsonb_array_elements_text(v_item -> 'topping_ids') x);
        if v_cnt <> (select count(distinct x) from jsonb_array_elements_text(v_item -> 'topping_ids') x) then
          raise exception using message = 'OPTION_UNAVAILABLE', detail = v_product.name;
        end if;
        v_opts := v_opts || v_opt;
        v_unit := v_unit + v_delta;
      end if;

      v_lines := v_lines || jsonb_build_array(jsonb_build_object(
        'kind', 'product', 'product_id', v_product.id, 'box_size_id', null, 'name', v_product.name,
        'unit_price', v_unit, 'quantity', v_qty, 'line_total', v_unit * v_qty,
        'options', v_opts, 'box_contents', '[]'::jsonb));
      v_need := jsonb_set(v_need, array[v_product.id::text],
        to_jsonb(coalesce((v_need ->> v_product.id::text)::int, 0) + v_qty));
      v_subtotal := v_subtotal + v_unit * v_qty;

    elsif v_item ->> 'type' = 'box' then
      if not store_flag(v_store, 'custom_boxes_enabled', true) then
        raise exception using message = 'BOXES_DISABLED';
      end if;
      select * into v_box from box_sizes where id = (v_item ->> 'box_size_id')::uuid and is_active;
      if not found then
        raise exception using message = 'ITEM_UNAVAILABLE', detail = 'This box size';
      end if;
      if jsonb_typeof(v_item -> 'contents') is distinct from 'array' then
        raise exception using message = 'BOX_INCOMPLETE', detail = v_box.name;
      end if;

      v_unit := v_box.price;
      v_slots := 0;
      v_contents := '[]';
      for v_c in select * from jsonb_array_elements(v_item -> 'contents') loop
        v_cqty := (v_c ->> 'quantity')::int;
        if v_cqty is null or v_cqty < 1 or v_cqty > v_box.slots then
          raise exception using message = 'INVALID_QUANTITY';
        end if;
        select pr.* into v_product
          from products pr
          join box_eligible_products be on be.product_id = pr.id and be.box_size_id = v_box.id
          left join categories c on c.id = pr.category_id
         where pr.id = (v_c ->> 'product_id')::uuid
           and pr.archived_at is null and pr.is_visible and not pr.is_sold_out
           and (pr.stock_quantity is null or pr.stock_quantity > 0)
           and (c.id is null or c.is_visible);
        if not found then
          select name into v_name from products where id = (v_c ->> 'product_id')::uuid;
          raise exception using message = 'ITEM_UNAVAILABLE', detail = coalesce(v_name, '');
        end if;
        v_slots := v_slots + v_cqty;
        v_unit := v_unit + v_product.box_surcharge * v_cqty;
        v_contents := v_contents || jsonb_build_array(jsonb_build_object(
          'product_id', v_product.id, 'name', v_product.name, 'quantity', v_cqty, 'surcharge', v_product.box_surcharge));
        v_need := jsonb_set(v_need, array[v_product.id::text],
          to_jsonb(coalesce((v_need ->> v_product.id::text)::int, 0) + v_cqty * v_qty));
      end loop;
      if v_slots <> v_box.slots then
        raise exception using message = 'BOX_INCOMPLETE', detail = v_box.name;
      end if;

      v_lines := v_lines || jsonb_build_array(jsonb_build_object(
        'kind', 'box', 'product_id', null, 'box_size_id', v_box.id, 'name', v_box.name,
        'unit_price', v_unit, 'quantity', v_qty, 'line_total', v_unit * v_qty,
        'options', '[]'::jsonb, 'box_contents', v_contents));
      v_subtotal := v_subtotal + v_unit * v_qty;
    else
      raise exception using message = 'INVALID_ITEM';
    end if;
  end loop;

  -- Stock (only for products with a stock limit)
  for v_key, v_val in select key, value::int from jsonb_each_text(v_need) loop
    select name, stock_quantity into v_name, v_stock from products where id = v_key::uuid;
    if v_stock is not null and v_stock < v_val then
      raise exception using message = 'OUT_OF_STOCK', detail = v_name;
    end if;
  end loop;

  -- Fulfillment
  v_method := coalesce(p ->> 'fulfillment_method', 'pickup')::fulfillment_method;
  if v_method = 'delivery' then
    if not store_flag(v_store, 'delivery_enabled', true) then
      raise exception using message = 'DELIVERY_DISABLED';
    end if;
    if nullif(p ->> 'delivery_area_id', '') is not null then
      select * into v_area from delivery_areas where id = (p ->> 'delivery_area_id')::uuid and is_active;
      if not found then
        raise exception using message = 'AREA_UNAVAILABLE';
      end if;
      v_fee := v_area.fee;
    elsif not p_dry_run then
      raise exception using message = 'AREA_UNAVAILABLE';
    end if;
  elsif not store_flag(v_store, 'pickup_enabled', true) then
    raise exception using message = 'PICKUP_DISABLED';
  end if;

  if v_payment = 'instapay' and not store_flag(v_store, 'instapay_enabled', true)
     or v_payment = 'cash' and not store_flag(v_store, 'cash_enabled', false)
     or v_payment not in ('instapay', 'cash') then
    raise exception using message = 'PAYMENT_METHOD_UNAVAILABLE';
  end if;

  if p_dry_run then
    return jsonb_build_object('lines', v_lines, 'subtotal', v_subtotal, 'delivery_fee', v_fee,
      'total', v_subtotal + v_fee);
  end if;

  -- Checks that only matter for a real order
  if v_method = 'delivery' and char_length(coalesce(v_address, '')) < 5 then
    raise exception using message = 'ADDRESS_REQUIRED';
  end if;

  if v_subtotal < coalesce(nullif(v_store ->> 'min_order_amount', '')::numeric, 0) then
    raise exception using message = 'BELOW_MINIMUM', detail = v_store ->> 'min_order_amount';
  end if;

  v_requested := nullif(p ->> 'requested_for', '')::timestamptz;
  if not store_flag(v_store, 'scheduling_enabled', false) then
    v_requested := null;
  elsif v_requested is not null and v_requested < now() then
    raise exception using message = 'INVALID_TIME';
  end if;

  v_cap := nullif(v_store ->> 'daily_order_capacity', '')::int;
  if v_cap is not null and v_cap > 0 and (
    select count(*) from orders
     where fulfillment_status <> 'canceled'
       and (coalesce(requested_for, created_at) at time zone 'Africa/Cairo')::date
         = (coalesce(v_requested, now()) at time zone 'Africa/Cairo')::date
  ) >= v_cap then
    raise exception using message = 'CAPACITY_REACHED';
  end if;

  -- Abuse guard per phone number (IP limits happen in the app before this call)
  if (select count(*) from orders
       where customer_phone = p -> 'customer' ->> 'phone' and created_at > now() - interval '15 minutes') >= 3 then
    raise exception using message = 'RATE_LIMITED';
  end if;

  update products pr set stock_quantity = pr.stock_quantity - n.qty
    from (select key::uuid as id, value::int as qty from jsonb_each_text(v_need)) n
   where pr.id = n.id and pr.stock_quantity is not null;

  insert into orders (idempotency_key, customer_name, customer_phone, customer_whatsapp, fulfillment_method,
                      delivery_area_id, delivery_area_name, delivery_address, requested_for, notes,
                      subtotal, delivery_fee, total, payment_method, ip_hash)
  values ((p ->> 'idempotency_key')::uuid,
          trim(p -> 'customer' ->> 'name'),
          p -> 'customer' ->> 'phone',
          coalesce(nullif(p -> 'customer' ->> 'whatsapp', ''), p -> 'customer' ->> 'phone'),
          v_method,
          case when v_method = 'delivery' then v_area.id end,
          case when v_method = 'delivery' then v_area.name end,
          case when v_method = 'delivery' then v_address end,
          v_requested,
          nullif(trim(p ->> 'notes'), ''),
          v_subtotal, v_fee, v_subtotal + v_fee, v_payment, p ->> 'ip_hash')
  returning id, order_number, public_token, total into v_order;

  insert into order_items (order_id, kind, product_id, box_size_id, name, unit_price, quantity, line_total, options, box_contents)
  select v_order.id, l ->> 'kind', (l ->> 'product_id')::uuid, (l ->> 'box_size_id')::uuid, l ->> 'name',
         (l ->> 'unit_price')::numeric, (l ->> 'quantity')::int, (l ->> 'line_total')::numeric, l -> 'options', l -> 'box_contents'
    from jsonb_array_elements(v_lines) l;

  insert into payment_records (order_id, provider, amount) values (v_order.id, v_payment, v_order.total);

  insert into order_status_history (order_id, kind, to_status, actor) values
    (v_order.id, 'fulfillment', 'received', 'customer'),
    (v_order.id, 'payment', 'pending', 'customer');

  return jsonb_build_object('order_id', v_order.id, 'order_number', v_order.order_number,
    'token', v_order.public_token, 'total', v_order.total, 'duplicate', false);
end $$;

-- report_payment: customer says "I've sent the payment". Never marks anything verified.
create or replace function public.report_payment(p_token text, p_reference text, p_receipt_path text)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_order orders%rowtype;
  v_count int;
begin
  select * into v_order from orders where public_token = p_token for update;
  if not found then
    raise exception using message = 'ORDER_NOT_FOUND';
  end if;
  if v_order.fulfillment_status = 'canceled' then
    raise exception using message = 'ORDER_CANCELED';
  end if;
  if v_order.payment_method <> 'instapay' then
    raise exception using message = 'INVALID_TRANSITION';
  end if;
  if p_receipt_path is not null and p_receipt_path not like v_order.id::text || '/%' then
    raise exception using message = 'INVALID_RECEIPT';
  end if;
  if v_order.payment_status not in ('pending', 'rejected') then
    return jsonb_build_object('changed', false, 'order_id', v_order.id, 'payment_status', v_order.payment_status);
  end if;

  update payment_records
     set status = 'reported',
         reference = coalesce(nullif(trim(p_reference), ''), reference),
         receipt_path = coalesce(p_receipt_path, receipt_path),
         reported_at = now(),
         report_count = report_count + 1,
         rejection_reason = null
   where id = (select id from payment_records where order_id = v_order.id order by created_at desc limit 1)
  returning report_count into v_count;

  update orders set payment_status = 'reported' where id = v_order.id;
  insert into order_status_history (order_id, kind, from_status, to_status, actor)
  values (v_order.id, 'payment', v_order.payment_status::text, 'reported', 'customer');

  return jsonb_build_object('changed', true, 'order_id', v_order.id, 'payment_status', 'reported', 'report_count', v_count);
end $$;

-- admin_update_order: every owner action on an order, with transition rules and history.
create or replace function public.admin_update_order(p_order_id uuid, p_action text, p_note text default null)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_order orders%rowtype;
  v_to_p payment_status;
  v_to_f fulfillment_status;
  v_note text := nullif(trim(p_note), '');
begin
  if not is_admin() then
    raise exception using message = 'NOT_AUTHORIZED', errcode = '42501';
  end if;

  select * into v_order from orders where id = p_order_id for update;
  if not found then
    raise exception using message = 'ORDER_NOT_FOUND';
  end if;

  case p_action
    when 'confirm_payment' then
      if v_order.fulfillment_status = 'canceled' or v_order.payment_status not in ('pending', 'reported', 'rejected') then
        raise exception using message = 'INVALID_TRANSITION';
      end if;
      v_to_p := 'verified';
    when 'reject_payment' then
      if v_order.payment_status <> 'reported' then
        raise exception using message = 'INVALID_TRANSITION';
      end if;
      if v_note is null then
        raise exception using message = 'REASON_REQUIRED';
      end if;
      v_to_p := 'rejected';
    when 'refund' then
      if v_order.payment_status <> 'verified' then
        raise exception using message = 'INVALID_TRANSITION';
      end if;
      v_to_p := 'refunded';
    when 'start_preparing' then
      if v_order.fulfillment_status <> 'received' then
        raise exception using message = 'INVALID_TRANSITION';
      end if;
      v_to_f := 'preparing';
    when 'mark_ready' then
      if v_order.fulfillment_status not in ('received', 'preparing') then
        raise exception using message = 'INVALID_TRANSITION';
      end if;
      v_to_f := 'ready';
    when 'out_for_delivery' then
      if v_order.fulfillment_method <> 'delivery' or v_order.fulfillment_status not in ('preparing', 'ready') then
        raise exception using message = 'INVALID_TRANSITION';
      end if;
      v_to_f := 'out_for_delivery';
    when 'complete' then
      if v_order.fulfillment_status not in ('ready', 'out_for_delivery') then
        raise exception using message = 'INVALID_TRANSITION';
      end if;
      v_to_f := 'completed';
    when 'cancel' then
      if v_order.fulfillment_status in ('completed', 'canceled') then
        raise exception using message = 'INVALID_TRANSITION';
      end if;
      v_to_f := 'canceled';
    else
      raise exception using message = 'UNKNOWN_ACTION';
  end case;

  if v_to_p is not null then
    update orders set payment_status = v_to_p where id = v_order.id;
    update payment_records
       set status = v_to_p,
           verified_at = case when v_to_p = 'verified' then now() else verified_at end,
           verified_by = case when v_to_p = 'verified' then auth.uid() else verified_by end,
           rejection_reason = case when v_to_p = 'rejected' then v_note else rejection_reason end
     where id = (select id from payment_records where order_id = v_order.id order by created_at desc limit 1);
    insert into order_status_history (order_id, kind, from_status, to_status, note, actor, actor_id)
    values (v_order.id, 'payment', v_order.payment_status::text, v_to_p::text, v_note, 'admin', auth.uid());
  end if;

  if v_to_f is not null then
    update orders set fulfillment_status = v_to_f where id = v_order.id;
    insert into order_status_history (order_id, kind, from_status, to_status, note, actor, actor_id)
    values (v_order.id, 'fulfillment', v_order.fulfillment_status::text, v_to_f::text, v_note, 'admin', auth.uid());

    if v_to_f = 'canceled' then
      perform restore_order_stock(v_order.id); -- defined in 20261011000400_stale_orders.sql
    end if;
  end if;

  return jsonb_build_object('payment_status', coalesce(v_to_p, v_order.payment_status),
    'fulfillment_status', coalesce(v_to_f, v_order.fulfillment_status));
end $$;

-- Dashboard numbers. Revenue = verified payment records only (Africa/Cairo calendar).
create or replace function public.admin_dashboard(p_days int default 30)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  tz constant text := 'Africa/Cairo';
  v_today date := (now() at time zone tz)::date;
  v_days int := least(greatest(coalesce(p_days, 30), 7), 365);
begin
  if not is_admin() then
    raise exception using message = 'NOT_AUTHORIZED', errcode = '42501';
  end if;

  return jsonb_build_object(
    'summary', (
      select jsonb_build_object(
        'total_orders', count(*) filter (where fulfillment_status <> 'canceled'),
        'today_orders', count(*) filter (where fulfillment_status <> 'canceled' and (created_at at time zone tz)::date = v_today),
        'new_orders', count(*) filter (where fulfillment_status = 'received'),
        'pending_payment', count(*) filter (where fulfillment_status <> 'canceled' and payment_status = 'pending'),
        'awaiting_verification', count(*) filter (where fulfillment_status <> 'canceled' and payment_status = 'reported'),
        'preparing', count(*) filter (where fulfillment_status = 'preparing'),
        'completed', count(*) filter (where fulfillment_status = 'completed'),
        'canceled', count(*) filter (where fulfillment_status = 'canceled'))
      from orders),
    'sales', (
      select jsonb_build_object(
        'today', coalesce(sum(amount) filter (where (verified_at at time zone tz)::date = v_today), 0),
        'month', coalesce(sum(amount) filter (where date_trunc('month', verified_at at time zone tz) = date_trunc('month', now() at time zone tz)), 0),
        'all_time', coalesce(sum(amount), 0),
        'range', coalesce(sum(amount) filter (where (verified_at at time zone tz)::date > v_today - v_days), 0))
      from payment_records where status = 'verified'),
    'orders_by_day', (
      select jsonb_agg(jsonb_build_object('date', d::date, 'orders', coalesce(o.c, 0)) order by d)
      from generate_series(v_today - (v_days - 1), v_today, interval '1 day') d
      left join (
        select (created_at at time zone tz)::date as day, count(*) as c
          from orders where fulfillment_status <> 'canceled' group by 1
      ) o on o.day = d::date),
    'revenue_by_week', (
      select jsonb_agg(jsonb_build_object('week', w::date, 'revenue', coalesce(r.s, 0)) order by w)
      from generate_series(date_trunc('week', v_today::timestamp) - interval '11 weeks', date_trunc('week', v_today::timestamp), interval '1 week') w
      left join (
        select date_trunc('week', verified_at at time zone tz) as wk, sum(amount) as s
          from payment_records where status = 'verified' group by 1
      ) r on r.wk = w),
    'revenue_by_month', (
      select jsonb_agg(jsonb_build_object('month', m::date, 'revenue', coalesce(r.s, 0)) order by m)
      from generate_series(date_trunc('month', v_today::timestamp) - interval '11 months', date_trunc('month', v_today::timestamp), interval '1 month') m
      left join (
        select date_trunc('month', verified_at at time zone tz) as mo, sum(amount) as s
          from payment_records where status = 'verified' group by 1
      ) r on r.mo = m),
    'popular_products', (
      select coalesce(jsonb_agg(t order by t.quantity desc), '[]') from (
        select max(name) as name, sum(qty)::int as quantity from (
          select oi.product_id::text as pid, oi.name, oi.quantity as qty
            from order_items oi join orders o on o.id = oi.order_id
           where oi.kind = 'product' and o.fulfillment_status <> 'canceled'
             and o.created_at > now() - make_interval(days => v_days)
          union all
          select c ->> 'product_id', c ->> 'name', (c ->> 'quantity')::int * oi.quantity
            from order_items oi join orders o on o.id = oi.order_id, jsonb_array_elements(oi.box_contents) c
           where oi.kind = 'box' and o.fulfillment_status <> 'canceled'
             and o.created_at > now() - make_interval(days => v_days)
        ) s group by coalesce(pid, name) order by 2 desc limit 8
      ) t),
    'payment_breakdown', (
      select coalesce(jsonb_object_agg(payment_status, c), '{}') from (
        select payment_status, count(*) as c from orders
         where fulfillment_status <> 'canceled' and created_at > now() - make_interval(days => v_days)
         group by 1
      ) s)
  );
end $$;

-- Public, PII-free: ids of the best-selling visible products over the last 90 days.
create or replace function public.best_seller_ids(p_limit int default 8)
returns table (product_id uuid, sold int)
language sql stable security definer set search_path = public as $$
  select s.pid, sum(s.qty)::int
    from (
      select oi.product_id as pid, oi.quantity as qty
        from order_items oi join orders o on o.id = oi.order_id
       where oi.kind = 'product' and o.fulfillment_status <> 'canceled' and o.created_at > now() - interval '90 days'
      union all
      select (c ->> 'product_id')::uuid, (c ->> 'quantity')::int * oi.quantity
        from order_items oi join orders o on o.id = oi.order_id, jsonb_array_elements(oi.box_contents) c
       where oi.kind = 'box' and o.fulfillment_status <> 'canceled' and o.created_at > now() - interval '90 days'
    ) s
    join products p on p.id = s.pid and p.is_visible and p.archived_at is null
   group by s.pid
   order by 2 desc
   limit least(greatest(p_limit, 1), 24);
$$;

-- Sliding-window rate limit. Returns false when the caller is over the limit.
create or replace function public.hit_rate_limit(p_key text, p_max int, p_window_seconds int)
returns boolean
language plpgsql security definer set search_path = public as $$
begin
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

-- Reviews only from completed orders, one per order, hidden until approved.
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
  insert into reviews (order_id, display_name, rating, body)
  values (v_order.id, trim(p_name), p_rating, trim(p_body))
  on conflict (order_id) do nothing;
  if not found then
    raise exception using message = 'ALREADY_REVIEWED';
  end if;
end $$;
