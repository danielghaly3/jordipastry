import type { Metadata } from "next";
import { AuthCard } from "@/components/admin/auth-card";
import { ForgotForm } from "@/components/admin/auth-forms";

export const metadata: Metadata = { title: "Reset password", robots: { index: false } };

export default function Page() {
  return <AuthCard title="Reset your password"><ForgotForm /></AuthCard>;
}
