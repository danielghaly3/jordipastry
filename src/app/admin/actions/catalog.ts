"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdmin } from "@/lib/auth";
import { fail, ok, type ActionResult } from "@/lib/errors";
import { slugify } from "@/lib/format";

const NO_SESSION = "Your session ended. Please sign in again.";
const done = () => revalidatePath("/", "layout");
type Sb = NonNullable<Awaited<ReturnType<typeof getAdmin>>>["supabase"];

async function reorder(sb: Sb, table: "categories" | "box_sizes" | "delivery_areas", id: string, direction: -1 | 1) {
  const { data } = await sb.from(table).select("id").order("sort_order").order("name");
  const ids = (data ?? []).map((r) => r.id);
  const i = ids.indexOf(id);
  const j = i + direction;
  if (i < 0 || j < 0 || j >= ids.length) return;
  [ids[i], ids[j]] = [ids[j], ids[i]];
  await Promise.all(ids.map((rid, index) => sb.from(table).update({ sort_order: index + 1 }).eq("id", rid)));
}

// Categories ---------------------------------------------------------------

const name = z.string().trim().min(1, "Please enter a name").max(60);

export async function createCategory(input: string): Promise<ActionResult<null>> {
  const admin = await getAdmin();
  if (!admin) return fail(NO_SESSION);
  const n = name.safeParse(input);
  if (!n.success) return fail(n.error.issues[0].message);
  const { data: last } = await admin.supabase.from("categories").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
  let slug = slugify(n.data);
  const { data: clash } = await admin.supabase.from("categories").select("id").eq("slug", slug).maybeSingle();
  if (clash) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
  const { error } = await admin.supabase.from("categories").insert({ name: n.data, slug, sort_order: (last?.sort_order ?? 0) + 1 });
  if (error) return fail("Couldn't add the category.");
  done();
  return ok(null);
}

export async function updateCategory(id: string, patch: { name?: string; is_visible?: boolean }): Promise<ActionResult<null>> {
  const admin = await getAdmin();
  if (!admin) return fail(NO_SESSION);
  const p = z.object({ name: name.optional(), is_visible: z.boolean().optional() }).safeParse(patch);
  if (!p.success || !z.uuid().safeParse(id).success) return fail(p.error?.issues[0]?.message ?? "Invalid change.");
  const { error } = await admin.supabase.from("categories").update(p.data).eq("id", id);
  if (error) return fail("Couldn't save the category.");
  done();
  return ok(null);
}

export async function moveCategory(id: string, direction: -1 | 1): Promise<ActionResult<null>> {
  const admin = await getAdmin();
  if (!admin) return fail(NO_SESSION);
  await reorder(admin.supabase, "categories", id, direction);
  done();
  return ok(null);
}

/** Deletes a category. Its products move to another category (or become uncategorized) first. */
export async function deleteCategory(id: string, moveTo: string | null): Promise<ActionResult<null>> {
  const admin = await getAdmin();
  if (!admin) return fail(NO_SESSION);
  if (!z.uuid().safeParse(id).success || (moveTo && !z.uuid().safeParse(moveTo).success) || moveTo === id) return fail("Invalid choice.");
  const { error: moveError } = await admin.supabase.from("products").update({ category_id: moveTo }).eq("category_id", id);
  if (moveError) return fail("Couldn't move the products. Nothing was deleted.");
  const { error } = await admin.supabase.from("categories").delete().eq("id", id);
  if (error) return fail("Couldn't delete the category.");
  done();
  return ok(null);
}

// Boxes ---------------------------------------------------------------------

const boxSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(1, "Please name the box").max(60),
  description: z.string().trim().max(300).default(""),
  slots: z.number().int().min(1, "A box needs at least 1 donut").max(48, "Max 48 donuts per box"),
  price: z.number().min(0).max(100000),
  is_active: z.boolean(),
  eligible: z.array(z.uuid()),
});

export async function saveBox(input: z.input<typeof boxSchema>): Promise<ActionResult<null>> {
  const admin = await getAdmin();
  if (!admin) return fail(NO_SESSION);
  const parsed = boxSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Please check the box details.");
  const { id, eligible, ...fields } = parsed.data;
  const sb = admin.supabase;
  let boxId = id;
  if (boxId) {
    const { error } = await sb.from("box_sizes").update(fields).eq("id", boxId);
    if (error) return fail("Couldn't save the box.");
  } else {
    const { data: last } = await sb.from("box_sizes").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
    const { data, error } = await sb.from("box_sizes").insert({ ...fields, sort_order: (last?.sort_order ?? 0) + 1 }).select("id").single();
    if (error || !data) return fail("Couldn't create the box.");
    boxId = data.id;
  }
  await sb.from("box_eligible_products").delete().eq("box_size_id", boxId);
  if (eligible.length) await sb.from("box_eligible_products").insert(eligible.map((p) => ({ box_size_id: boxId, product_id: p })));
  done();
  return ok(null);
}

export async function moveBox(id: string, direction: -1 | 1): Promise<ActionResult<null>> {
  const admin = await getAdmin();
  if (!admin) return fail(NO_SESSION);
  await reorder(admin.supabase, "box_sizes", id, direction);
  done();
  return ok(null);
}

export async function deleteBox(id: string): Promise<ActionResult<null>> {
  const admin = await getAdmin();
  if (!admin) return fail(NO_SESSION);
  const { error } = await admin.supabase.from("box_sizes").delete().eq("id", id);
  if (error) return fail("Couldn't delete the box.");
  done();
  return ok(null);
}

export async function saveSurcharges(values: { id: string; box_surcharge: number }[]): Promise<ActionResult<null>> {
  const admin = await getAdmin();
  if (!admin) return fail(NO_SESSION);
  const parsed = z.array(z.object({ id: z.uuid(), box_surcharge: z.number().min(0).max(10000) })).max(500).safeParse(values);
  if (!parsed.success) return fail("Please enter valid amounts (0 or more).");
  await Promise.all(parsed.data.map((v) => admin.supabase.from("products").update({ box_surcharge: v.box_surcharge }).eq("id", v.id)));
  done();
  return ok(null);
}

// Delivery areas -------------------------------------------------------------

const areaSchema = z.object({ id: z.uuid().optional(), name: z.string().trim().min(1, "Please name the area").max(80), fee: z.number().min(0).max(10000), is_active: z.boolean() });

export async function saveArea(input: z.input<typeof areaSchema>): Promise<ActionResult<null>> {
  const admin = await getAdmin();
  if (!admin) return fail(NO_SESSION);
  const parsed = areaSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Please check the area.");
  const { id, ...fields } = parsed.data;
  if (id) {
    const { error } = await admin.supabase.from("delivery_areas").update(fields).eq("id", id);
    if (error) return fail("Couldn't save the area.");
  } else {
    const { data: last } = await admin.supabase.from("delivery_areas").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
    const { error } = await admin.supabase.from("delivery_areas").insert({ ...fields, sort_order: (last?.sort_order ?? 0) + 1 });
    if (error) return fail("Couldn't add the area.");
  }
  done();
  return ok(null);
}

export async function deleteArea(id: string): Promise<ActionResult<null>> {
  const admin = await getAdmin();
  if (!admin) return fail(NO_SESSION);
  // Past orders keep the area name they were placed with.
  const { error } = await admin.supabase.from("delivery_areas").delete().eq("id", id);
  if (error) return fail("Couldn't delete the area.");
  done();
  return ok(null);
}

export async function moveArea(id: string, direction: -1 | 1): Promise<ActionResult<null>> {
  const admin = await getAdmin();
  if (!admin) return fail(NO_SESSION);
  await reorder(admin.supabase, "delivery_areas", id, direction);
  done();
  return ok(null);
}

// Reviews ---------------------------------------------------------------------

export async function moderateReview(id: string, action: "approve" | "hide" | "delete"): Promise<ActionResult<null>> {
  const admin = await getAdmin();
  if (!admin) return fail(NO_SESSION);
  if (!z.uuid().safeParse(id).success) return fail("Invalid review.");
  const { error } = action === "delete"
    ? await admin.supabase.from("reviews").delete().eq("id", id)
    : await admin.supabase.from("reviews").update({ is_approved: action === "approve", approved_at: action === "approve" ? new Date().toISOString() : null }).eq("id", id);
  if (error) return fail("Couldn't update the review.");
  done();
  return ok(null);
}

export async function setFeatured(ids: string[]): Promise<ActionResult<null>> {
  const admin = await getAdmin();
  if (!admin) return fail(NO_SESSION);
  const parsed = z.array(z.uuid()).max(30).safeParse(ids);
  if (!parsed.success) return fail("Invalid selection.");
  const { error } = await admin.supabase.from("products").update({ is_featured: false }).eq("is_featured", true);
  if (!error && parsed.data.length) await admin.supabase.from("products").update({ is_featured: true }).in("id", parsed.data);
  done();
  return error ? fail("Couldn't save featured products.") : ok(null);
}
