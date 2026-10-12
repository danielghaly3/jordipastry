-- Jordi Pastry menu, taken from the official printed menu boards (prices in EGP).
-- Safe to run once on a fresh database. Edit everything later from the dashboard.
-- Descriptions are intentionally empty: the printed menu has none, so nothing is invented.

insert into public.categories (name, slug, sort_order) values
  ('Donuts', 'donuts', 1),
  ('Cinnamon Rolls', 'cinnamon-rolls', 2),
  ('Cookies', 'cookies', 3),
  ('Cookie Tart', 'cookie-tart', 4)
on conflict (slug) do nothing;

insert into public.products (category_id, name, name_ar, slug, price, flavor, is_featured, box_surcharge, sort_order)
select c.id, v.name, v.name_ar, v.slug, v.price, v.flavor, v.featured, v.surcharge, v.sort
from (values
  ('donuts', 'Glazed Donut', 'دونات جليز', 'glazed-donut', 40, 'glazed', true, 0, 1),
  ('donuts', 'Dark Chocolate Donut', 'دونات دارك شوكليت', 'dark-chocolate-donut', 40, 'chocolate', true, 0, 2),
  ('donuts', 'White Chocolate Donut', 'دونات وايت شوكليت', 'white-chocolate-donut', 40, 'white chocolate', false, 0, 3),
  ('donuts', 'White & Dark Chocolate Mix Donut', 'دونات مكس وايت & دارك شوكليت', 'white-dark-chocolate-mix-donut', 40, 'chocolate', false, 0, 4),
  ('donuts', 'Caramel Donut', 'دونات كراميل', 'caramel-donut', 40, 'caramel', false, 0, 5),
  ('donuts', 'Lotus Donut', 'دونات لوتس', 'lotus-donut', 50, 'lotus', true, 10, 6),
  ('donuts', 'Nutella Donut', 'دونات نوتيلا', 'nutella-donut', 50, 'nutella', false, 10, 7),
  ('donuts', 'Pistachio Donut', 'دونات بستاشيو', 'pistachio-donut', 50, 'pistachio', true, 10, 8),
  ('donuts', 'Raffaello Donut', 'دونات رافاييلو', 'raffaello-donut', 40, 'raffaello', false, 0, 9),
  ('donuts', 'Ferrero Rocher Donut', 'دونات فيريرو روشيه', 'ferrero-rocher-donut', 40, 'ferrero', false, 0, 10),
  ('donuts', 'Kinder Donut', 'دونات كيندر', 'kinder-donut', 40, 'kinder', false, 0, 11),
  ('donuts', 'Oreo Donut', 'دونات اوريو', 'oreo-donut', 40, 'oreo', false, 0, 12),
  ('donuts', 'Blueberry Donut', 'دونات بلوبيري', 'blueberry-donut', 40, 'blueberry', true, 0, 13),
  ('donuts', 'Strawberry Donut', 'دونات فراولة', 'strawberry-donut', 40, 'strawberry', true, 0, 14),
  ('cinnamon-rolls', 'Classic Chocolate Roll', 'سينابون كلاسيك رول شوكليت', 'classic-chocolate-roll', 60, 'chocolate', false, 0, 21),
  ('cinnamon-rolls', 'Classic White Chocolate Roll', 'سينابون كلاسيك رول وايت شوكليت', 'classic-white-chocolate-roll', 60, 'white chocolate', false, 0, 22),
  ('cinnamon-rolls', 'Classic Pistachio Roll', 'سينابون كلاسيك رول بستاشيو', 'classic-pistachio-roll', 70, 'pistachio', false, 0, 23),
  ('cinnamon-rolls', 'Classic Strawberry Roll', 'سينابون كلاسيك رول فراولة', 'classic-strawberry-roll', 60, 'strawberry', false, 0, 24),
  ('cinnamon-rolls', 'Classic Caramel Roll', 'سينابون كلاسيك رول كراميل', 'classic-caramel-roll', 60, 'caramel', false, 0, 25),
  ('cinnamon-rolls', 'Classic Lotus Roll', 'سينابون كلاسيك رول لوتس', 'classic-lotus-roll', 70, 'lotus', false, 0, 26),
  ('cookies', 'Chocolate Cookie', 'كوكيز شوكليت', 'chocolate-cookie', 35, 'chocolate', false, 0, 31),
  ('cookies', 'White Chocolate Cookie', 'كوكيز وايت شوكليت', 'white-chocolate-cookie', 35, 'white chocolate', false, 0, 32),
  ('cookies', 'Red Velvet Cookie', 'كوكيز ريد فيلفت', 'red-velvet-cookie', 35, 'red velvet', false, 0, 33),
  ('cookies', 'Marshmallow Cookie', 'كوكيز مارشميلو', 'marshmallow-cookie', 35, 'marshmallow', false, 0, 34),
  ('cookie-tart', 'Cookie Tart', 'تارت كوكيز', 'cookie-tart', 100, 'chocolate', false, 0, 41),
  ('cookie-tart', 'Large Cookie Tart', 'تارت كوكيز كبير', 'large-cookie-tart', 250, 'chocolate', false, 0, 42)
) as v(cat, name, name_ar, slug, price, flavor, featured, surcharge, sort)
join public.categories c on c.slug = v.cat
on conflict (slug) do nothing;

-- Custom boxes: priced at the menu price per donut (EGP 40), with a EGP 10 surcharge for the EGP 50 flavors.
-- No discount is assumed; the owner can set box prices in Dashboard → Donut Boxes.
insert into public.box_sizes (name, description, slots, price, sort_order)
select * from (values
  ('Box of 3', 'Pick three favorites.', 3, 120::numeric, 1),
  ('Box of 6', 'Six donuts, your way.', 6, 240::numeric, 2),
  ('Box of 12', 'A dozen for sharing.', 12, 480::numeric, 3)
) v(name, description, slots, price, sort)
where not exists (select 1 from public.box_sizes);

insert into public.box_eligible_products (box_size_id, product_id)
select b.id, p.id
from public.box_sizes b
cross join public.products p
join public.categories c on c.id = p.category_id and c.slug = 'donuts'
on conflict do nothing;

-- Delivery zones are NOT on the menu: these two are placeholders. Edit them in Dashboard → Store Settings → Delivery.
insert into public.delivery_areas (name, fee, sort_order)
select * from (values ('Zone A (sample)', 30::numeric, 1), ('Zone B (sample)', 60::numeric, 2)) v(name, fee, sort)
where not exists (select 1 from public.delivery_areas);

-- Contact numbers as printed on the menu.
insert into public.site_settings (key, value, is_public) values
  ('contact', '{"phone": "01285706292", "whatsapp": "01000382001", "email": "jordipasrty@gmail.com", "instagram": "https://www.instagram.com/jordipasrty", "facebook": "https://www.facebook.com/profile.php?id=61586344850641", "tiktok": "https://www.tiktok.com/@jordi.pastry"}', true)
on conflict (key) do nothing;
