import "server-only";
import { redirect } from "next/navigation";
import { createSessionClient } from "@/lib/supabase/server";

/** Server-side guard for every admin page and action (the proxy redirect is only a convenience). */
export async function requireAdmin() {
  const supabase = await createSessionClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: profile } = await supabase.from("admin_profiles").select("user_id,display_name").eq("user_id", user.id).maybeSingle();
  if (!profile) redirect("/admin/login?error=not-admin");
  return { supabase, user, profile };
}

/** For server actions: same check but returns null instead of redirecting. */
export async function getAdmin() {
  const supabase = await createSessionClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("admin_profiles").select("user_id").eq("user_id", user.id).maybeSingle();
  return profile ? { supabase, user } : null;
}
