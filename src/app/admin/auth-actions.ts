"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { SITE_URL } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { createSessionClient } from "@/lib/supabase/server";

type State = { error?: string; message?: string } | undefined;

export async function signIn(_: State, form: FormData): Promise<State> {
  const parsed = z.object({ email: z.email(), password: z.string().min(1).max(200) }).safeParse({ email: form.get("email"), password: form.get("password") });
  if (!parsed.success) return { error: "Please enter your email and password." };
  if (!(await rateLimit("login", 10, 900, true))) return { error: "Too many attempts. Please wait 15 minutes." };
  const supabase = await createSessionClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error || !data.user) return { error: "That email or password isn't right." };
  const { data: profile } = await supabase.from("admin_profiles").select("user_id").eq("user_id", data.user.id).maybeSingle();
  if (!profile) {
    await supabase.auth.signOut();
    return { error: "This account doesn't have access to the dashboard." };
  }
  redirect("/admin");
}

export async function signOut() {
  const supabase = await createSessionClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function requestReset(_: State, form: FormData): Promise<State> {
  const email = z.email().safeParse(form.get("email"));
  if (!email.success) return { error: "Please enter a valid email." };
  if (!(await rateLimit("reset", 5, 3600, true))) return { error: "Too many requests. Please try again later." };
  const supabase = await createSessionClient();
  await supabase.auth.resetPasswordForEmail(email.data, { redirectTo: `${SITE_URL}/auth/confirm?next=/admin/reset-password` });
  // Same answer either way so nobody can probe which emails exist.
  return { message: "If that email belongs to an admin, a reset link is on its way. Check your inbox." };
}

export async function updatePassword(_: State, form: FormData): Promise<State> {
  const password = String(form.get("password") ?? "");
  if (password.length < 10) return { error: "Use at least 10 characters." };
  if (password !== form.get("confirm")) return { error: "The two passwords don't match." };
  const supabase = await createSessionClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Your reset link has expired. Please request a new one." };
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "Couldn't update the password. Try a stronger one." };
  redirect("/admin");
}
