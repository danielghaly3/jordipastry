/**
 * Round-robin across categories so curated strips (hero, showcase, ribbon, banner) show the whole
 * menu, not just one category. Keeps the input order inside each category (pass featured first).
 */
export function spreadAcrossMenu<T extends { category_id: string | null }>(items: T[]): T[] {
  const groups = new Map<string | null, T[]>();
  for (const item of items) groups.set(item.category_id, [...(groups.get(item.category_id) ?? []), item]);
  const lists = [...groups.values()];
  const out: T[] = [];
  for (let i = 0; out.length < items.length; i++) for (const list of lists) if (list[i]) out.push(list[i]);
  return out;
}
