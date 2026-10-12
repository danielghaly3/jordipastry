import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { notifyOrderEvent } from "@/lib/notify";
import { readSetting } from "@/lib/settings";
import { createServiceClient } from "@/lib/supabase/server";

// Called by Vercel Cron (see vercel.json) with "Authorization: Bearer <CRON_SECRET>".
// Sends one "needs attention" reminder per order that is still unpaid or waiting for the owner's payment check.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  if (!secret || given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const db = createServiceClient();
  const { data: storeRow } = await db.from("site_settings").select("value").eq("key", "store").maybeSingle();
  const store = readSetting("store", storeRow?.value);
  const hours = store.attention_after_hours;
  // Release stock and capacity held by InstaPay orders nobody paid for.
  const { data: canceled } = await db.rpc("cancel_stale_orders", { p_hours: store.auto_cancel_unpaid_hours });
  if ((canceled as string[] | null)?.length) revalidatePath("/", "layout"); // released stock shows on cached pages
  const cutoff = new Date(Date.now() - hours * 3_600_000).toISOString();
  const { data: orders } = await db
    .from("orders")
    .select("id,payment_status")
    .in("payment_status", ["pending", "reported"])
    .not("fulfillment_status", "in", "(canceled,completed)")
    .lt("created_at", cutoff)
    .order("created_at")
    .limit(20);
  for (const o of orders ?? []) {
    await notifyOrderEvent(o.id, "needs_attention", "", o.payment_status === "reported"
      ? `The customer reported paying more than ${hours} h ago and it's still not confirmed.`
      : `This order has been waiting for payment for more than ${hours} h.`);
  }
  return NextResponse.json({ checked: orders?.length ?? 0, autoCanceled: (canceled as string[] | null)?.length ?? 0 });
}
