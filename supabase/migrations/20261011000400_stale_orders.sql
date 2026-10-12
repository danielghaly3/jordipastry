-- Auto-cancel InstaPay orders that were never paid (and never reported as paid),
-- so abandoned or fake orders don't keep stock reserved or fill daily capacity.

create or replace function public.restore_order_stock(p_order_id uuid) returns void
language sql security definer set search_path = public as $$
  update products pr set stock_quantity = pr.stock_quantity + n.qty
    from (
      select id, sum(qty)::int as qty from (
        select product_id as id, quantity as qty
          from order_items where order_id = p_order_id and kind = 'product' and product_id is not null
        union all
        select (c ->> 'product_id')::uuid, (c ->> 'quantity')::int * oi.quantity
          from order_items oi, jsonb_array_elements(oi.box_contents) c
         where oi.order_id = p_order_id and oi.kind = 'box'
      ) s group by id
    ) n
   where pr.id = n.id and pr.stock_quantity is not null;
$$;

create or replace function public.cancel_stale_orders(p_hours int)
returns setof uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
begin
  if p_hours is null or p_hours < 1 then
    return;
  end if;
  for v_id in
    select id from orders
     where payment_method = 'instapay' and payment_status = 'pending'
       and fulfillment_status = 'received'
       and created_at < now() - make_interval(hours => p_hours)
     for update skip locked
  loop
    update orders set fulfillment_status = 'canceled' where id = v_id;
    insert into order_status_history (order_id, kind, from_status, to_status, note, actor)
    values (v_id, 'fulfillment', 'received', 'canceled', format('Not paid within %s hours', p_hours), 'system');
    perform restore_order_stock(v_id);
    return next v_id;
  end loop;
end $$;

revoke execute on function public.restore_order_stock(uuid) from public, anon, authenticated;
revoke execute on function public.cancel_stale_orders(int) from public, anon, authenticated;
grant execute on function public.cancel_stale_orders(int) to service_role;
