-- Bilingual menu: optional Arabic product name, shown next to the English name (as on the printed menu).
alter table public.products add column if not exists name_ar text check (char_length(name_ar) <= 80);
