import type { Metadata } from "next";
import { AuthCard } from "@/components/admin/auth-card";
import { LoginForm } from "@/components/admin/auth-forms";

export const metadata: Metadata = { title: "Owner sign in", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <AuthCard title="Welcome back">
      <LoginForm notice={error === "not-admin" ? "That account doesn't have access to the dashboard." : undefined} />
    </AuthCard>
  );
}
