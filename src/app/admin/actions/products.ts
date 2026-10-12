"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdmin } from "@/lib/auth";
import { fail, ok, type ActionResult } from "@/lib/errors";
import { slugify } from "@/lib/format";
import { productInputSchema, type ProductInput } from "@/lib/product-schema";

const NO_SESSION = "Your session ended. Please sign in again.";
const done = () => revalidatePath("/", "layout");

async function uniqueSlug(supabase: NonNullable<Awaited<ReturnType<typeof getAdmin>>>["supabase"], name: string) {
  const base = slugify(name);
  const { data } = await supabase.from("products").select("slug").like("slug", `${base}%`);
  const taken = new Set((data ?? []).map((r) => r.slug));
  if (!taken.has(base)) return base;
  for (let i = 2; ; i++) if (!taken.has(`${base}-${i}`)) return `${base}-${i}`;
}

export async function saveProduct(input: ProductInput): Promise<ActionResult<{ id: string }>> {
  const admin = await getAdmin();
  if (!admin) return fail(NO_SESSION);
  const parsed = productInputSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Please check the form.");
  const { id, images, options, box_ids, ...fields } = parsed.data;
  const sb = admin.supabase;
  const row = { ...fields, name_ar: fields.name_ar || null, flavor: fields.flavor || null, ingredients: fields.ingredients || null };

  let productId = id;
  if (productId) {
    const { error } = await sb.from("products").update({ ...row, is_sample: false }).eq("id", productId);
    if (error) return fail("Couldn't save the product. Please try again.");
  } else {
    const { data: last } = await sb.from("products").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
    const { data, error } = await sb.from("products").insert({ ...row, slug: await uniqueSlug(sb, fields.name), sort_order: (last?.sort_order ?? 0) + 1 }).select("id").single();
    if (error || !data) return fail("Couldn't create the product. Please try again.");
    productId = data.id;
  }

  // Photos: keep the given order; remove rows (and files) that were taken out.
  const { data: oldImages } = await sb.from("product_images").select("id,storage_path").eq("product_id", productId);
  const keep = new Set(images.map((i) => i.storage_path));
  const removed = (oldImages ?? []).filter((i) => !keep.has(i.storage_path));
  if (removed.length) {
    await sb.from("product_images").delete().in("id", removed.map((r) => r.id));
    await sb.storage.from("product-images").remove(removed.map((r) => r.storage_path));
  }
  for (const [index, img] of images.entries()) {
    const existing = oldImages?.find((o) => o.storage_path === img.storage_path);
    if (existing) await sb.from("product_images").update({ sort_order: index, alt: img.alt }).eq("id", existing.id);
    else await sb.from("product_images").insert({ product_id: productId, storage_path: img.storage_path, alt: img.alt, sort_order: index });
  }

  // Options (variants + toppings). Old orders keep their own copies, so deleting is safe.
  const { data: oldOptions } = await sb.from("product_options").select("id").eq("product_id", productId);
  const keepIds = new Set(options.filter((o) => o.id).map((o) => o.id));
  const drop = (oldOptions ?? []).filter((o) => !keepIds.has(o.id)).map((o) => o.id);
  if (drop.length) await sb.from("product_options").delete().in("id", drop);
  for (const [index, o] of options.entries()) {
    const values = { kind: o.kind, name: o.name, price_delta: o.price_delta, is_available: o.is_available, sort_order: index };
    if (o.id) await sb.from("product_options").update(values).eq("id", o.id).eq("product_id", productId);
    else await sb.from("product_options").insert({ ...values, product_id: productId });
  }

  // Which custom boxes may contain this flavor
  await sb.from("box_eligible_products").delete().eq("product_id", productId);
  if (box_ids.length) await sb.from("box_eligible_products").insert(box_ids.map((b) => ({ box_size_id: b, product_id: productId })));

  done();
  return ok({ id: productId! });
}

const idSchema = z.uuid();

export async function setProductFlags(id: string, patch: { is_sold_out?: boolean; is_visible?: boolean; is_featured?: boolean }): Promise<ActionResult<null>> {
  const admin = await getAdmin();
  if (!admin) return fail(NO_SESSION);
  const flags = z.object({ is_sold_out: z.boolean().optional(), is_visible: z.boolean().optional(), is_featured: z.boolean().optional() }).strict().safeParse(patch);
  if (!idSchema.safeParse(id).success || !flags.success) return fail("Invalid change.");
  const { error } = await admin.supabase.from("products").update(flags.data).eq("id", id);
  if (error) return fail("Couldn't update. Please try again.");
  done();
  return ok(null);
}

export async function moveProduct(id: string, direction: -1 | 1): Promise<ActionResult<null>> {
  const admin = await getAdmin();
  if (!admin) return fail(NO_SESSION);
  const { data } = await admin.supabase.from("products").select("id").is("archived_at", null).order("sort_order").order("name");
  const ids = (data ?? []).map((r) => r.id);
  const i = ids.indexOf(id);
  const j = i + direction;
  if (i < 0 || j < 0 || j >= ids.length) return ok(null);
  [ids[i], ids[j]] = [ids[j], ids[i]];
  await Promise.all(ids.map((pid, index) => admin.supabase.from("products").update({ sort_order: index + 1 }).eq("id", pid)));
  done();
  return ok(null);
}

export async function duplicateProduct(id: string): Promise<ActionResult<{ id: string }>> {
  const admin = await getAdmin();
  if (!admin) return fail(NO_SESSION);
  const sb = admin.supabase;
  const { data: p } = await sb.from("products").select("*,options:product_options(*),boxes:box_eligible_products(box_size_id)").eq("id", id).single();
  if (!p) return fail("Product not found.");
  // Photos are not copied (each product owns its files); the copy starts hidden so it can be edited first.
  const { id: _old, created_at: _c, updated_at: _u, options, boxes, ...rest } = p;
  void _old; void _c; void _u;
  const { data: copy, error } = await sb
    .from("products")
    .insert({ ...rest, name: `${p.name} (copy)`.slice(0, 80), slug: await uniqueSlug(sb, `${p.name} copy`), is_visible: false, is_featured: false, is_sample: false, archived_at: null, sort_order: p.sort_order + 1 })
    .select("id")
    .single();
  if (error || !copy) return fail("Couldn't duplicate.");
  if (options?.length) await sb.from("product_options").insert(options.map((o: { kind: string; name: string; price_delta: number; is_available: boolean; sort_order: number }) => ({ kind: o.kind, name: o.name, price_delta: o.price_delta, is_available: o.is_available, sort_order: o.sort_order, product_id: copy.id })));
  if (boxes?.length) await sb.from("box_eligible_products").insert(boxes.map((b: { box_size_id: string }) => ({ box_size_id: b.box_size_id, product_id: copy.id })));
  done();
  return ok({ id: copy.id });
}

export async function archiveProduct(id: string, archived: boolean): Promise<ActionResult<null>> {
  const admin = await getAdmin();
  if (!admin) return fail(NO_SESSION);
  if (!idSchema.safeParse(id).success) return fail("Invalid product.");
  const { error } = await admin.supabase.from("products").update(archived ? { archived_at: new Date().toISOString(), is_featured: false } : { archived_at: null }).eq("id", id);
  if (error) return fail("Couldn't update. Please try again.");
  done();
  return ok(null);
}

export async function deleteProduct(id: string): Promise<ActionResult<null>> {
  const admin = await getAdmin();
  if (!admin) return fail(NO_SESSION);
  if (!idSchema.safeParse(id).success) return fail("Invalid product.");
  const { data: images } = await admin.supabase.from("product_images").select("storage_path").eq("product_id", id);
  const { error } = await admin.supabase.from("products").delete().eq("id", id);
  if (error) return fail("Couldn't delete. Try archiving it instead.");
  if (images?.length) await admin.supabase.storage.from("product-images").remove(images.map((i) => i.storage_path));
  done();
  return ok(null);
}
