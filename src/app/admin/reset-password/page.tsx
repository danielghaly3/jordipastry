import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/admin/auth-card";
import { ResetForm } from "@/components/admin/auth-forms";
import { createSessionClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

export default async function Page() {
  const { data: { user } } = await (await createSessionClient()).auth.getUser();
  return (
    <AuthCard title="Choose a new password">
      {user ? <ResetForm /> : (
        <p className="mt-4 text-cocoa-muted">This reset link has expired or was already used. <Link href="/admin/forgot-password" className="font-semibold text-pink-ink underline">Request a new one</Link>.</p>
      )}
    </AuthCard>
  );
}
