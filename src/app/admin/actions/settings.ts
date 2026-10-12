"use server";
import { revalidatePath } from "next/cache";
import { getAdmin } from "@/lib/auth";
import { fail, ok, type ActionResult } from "@/lib/errors";
import { readSetting, SETTINGS, type SettingsKey } from "@/lib/settings";
import { sendTestNotification, retryNotification } from "@/lib/notify";

/** Saves one settings document. Partial updates are merged onto the current value, then validated. */
export async function saveSetting(key: SettingsKey, patch: Record<string, unknown>): Promise<ActionResult<null>> {
  const admin = await getAdmin();
  if (!admin) return fail("Your session ended. Please sign in again.");
  if (!(key in SETTINGS)) return fail("Unknown setting.");
  const { data: current } = await admin.supabase.from("site_settings").select("value").eq("key", key).maybeSingle();
  const merged = { ...readSetting(key, current?.value), ...patch };
  const parsed = SETTINGS[key].schema.safeParse(merged);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return fail(`Please check "${String(issue?.path[0] ?? "a field").replace(/_/g, " ")}": ${issue?.message ?? "invalid value"}`);
  }
  const { error } = await admin.supabase
    .from("site_settings")
    .upsert({ key, value: parsed.data, is_public: SETTINGS[key].public, updated_by: admin.user.id });
  if (error) return fail("Couldn't save. Please try again.");
  revalidatePath("/", "layout");
  return ok(null);
}

export async function testTelegram(): Promise<ActionResult<null>> {
  if (!(await getAdmin())) return fail("Your session ended. Please sign in again.");
  return (await sendTestNotification()) ? ok(null) : fail("The test message didn't go through. See the error in the list below.");
}

export async function retryAlert(logId: string): Promise<ActionResult<null>> {
  if (!(await getAdmin())) return fail("Your session ended. Please sign in again.");
  const sent = await retryNotification(logId);
  revalidatePath("/admin", "layout");
  return sent ? ok(null) : fail("Still failing. Check the error message.");
}

export async function retryAllAlerts(): Promise<ActionResult<{ sent: number; failed: number }>> {
  const admin = await getAdmin();
  if (!admin) return fail("Your session ended. Please sign in again.");
  const { data } = await admin.supabase.from("notification_logs").select("id").in("status", ["failed", "pending"]).order("created_at").limit(25);
  let sent = 0;
  for (const row of data ?? []) if (await retryNotification(row.id)) sent++;
  revalidatePath("/admin", "layout");
  return ok({ sent, failed: (data?.length ?? 0) - sent });
}
