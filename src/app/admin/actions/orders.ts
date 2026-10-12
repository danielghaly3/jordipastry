"use server";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { getAdmin } from "@/lib/auth";
import { fail, friendlyError, ok, type ActionResult } from "@/lib/errors";
import { notifyOrderEvent } from "@/lib/notify";

const ACTIONS = ["confirm_payment", "reject_payment", "refund", "start_preparing", "mark_ready", "out_for_delivery", "complete", "cancel"] as const;
export type OrderAction = (typeof ACTIONS)[number];

export async function updateOrder(orderId: string, action: OrderAction, note?: string): Promise<ActionResult<null>> {
  const admin = await getAdmin();
  if (!admin) return fail("Your session ended. Please sign in again.");
  const parsed = z.object({ id: z.uuid(), action: z.enum(ACTIONS), note: z.string().max(300).optional() }).safeParse({ id: orderId, action, note });
  if (!parsed.success) return fail("That action isn't valid.");
  const { error } = await admin.supabase.rpc("admin_update_order", { p_order_id: orderId, p_action: action, p_note: note ?? null });
  if (error) return fail(friendlyError(error));
  if (action === "cancel") after(() => notifyOrderEvent(orderId, "order_canceled"));
  // Whole site: canceling returns stock, which the cached store pages show.
  revalidatePath("/", "layout");
  return ok(null);
}
