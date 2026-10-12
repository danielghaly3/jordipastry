"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import { requestReset, signIn, updatePassword } from "@/app/admin/auth-actions";
import { inputClass } from "@/components/checkout/field";
import { btn } from "@/components/ui/button";

function Feedback({ state }: { state?: { error?: string; message?: string } }) {
  if (state?.error) return <p className="rounded-2xl bg-bad-tint px-4 py-3 text-sm font-semibold text-bad" role="alert">{state.error}</p>;
  if (state?.message) return <p className="rounded-2xl bg-good-tint px-4 py-3 text-sm font-semibold text-good" role="status">{state.message}</p>;
  return null;
}

export function LoginForm({ notice }: { notice?: string }) {
  const [state, action, pending] = useActionState(signIn, undefined);
  const [email, setEmail] = useState(""); // kept across failed attempts (React resets uncontrolled fields)
  return (
    <form action={action} className="mt-6 grid gap-4">
      {notice && !state && <p className="rounded-2xl bg-warn-tint px-4 py-3 text-sm font-semibold text-warn">{notice}</p>}
      <div className="grid gap-1.5">
        <label htmlFor="email" className="font-semibold">Email</label>
        <input id="email" name="email" type="email" autoComplete="username" required className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="password" className="font-semibold">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className={inputClass} />
      </div>
      <Feedback state={state} />
      <button type="submit" disabled={pending} className={btn("primary", "lg", "w-full")}>{pending && <Loader2 className="h-5 w-5 animate-spin" />} Sign in</button>
      <Link href="/admin/forgot-password" className="text-center text-sm font-semibold text-pink-ink hover:underline">Forgot your password?</Link>
    </form>
  );
}

export function ForgotForm() {
  const [state, action, pending] = useActionState(requestReset, undefined);
  return (
    <form action={action} className="mt-6 grid gap-4">
      <p className="text-cocoa-muted">Enter your admin email and we&apos;ll send you a link to set a new password.</p>
      <div className="grid gap-1.5">
        <label htmlFor="email" className="font-semibold">Email</label>
        <input id="email" name="email" type="email" autoComplete="username" required className={inputClass} />
      </div>
      <Feedback state={state} />
      <button type="submit" disabled={pending} className={btn("primary", "lg", "w-full")}>{pending && <Loader2 className="h-5 w-5 animate-spin" />} Send reset link</button>
      <Link href="/admin/login" className="text-center text-sm font-semibold text-pink-ink hover:underline">Back to sign in</Link>
    </form>
  );
}

export function ResetForm() {
  const [state, action, pending] = useActionState(updatePassword, undefined);
  return (
    <form action={action} className="mt-6 grid gap-4">
      <div className="grid gap-1.5">
        <label htmlFor="password" className="font-semibold">New password</label>
        <input id="password" name="password" type="password" autoComplete="new-password" minLength={10} required className={inputClass} />
        <p className="text-sm text-cocoa-muted">At least 10 characters.</p>
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="confirm" className="font-semibold">Type it again</label>
        <input id="confirm" name="confirm" type="password" autoComplete="new-password" required className={inputClass} />
      </div>
      <Feedback state={state} />
      <button type="submit" disabled={pending} className={btn("primary", "lg", "w-full")}>{pending && <Loader2 className="h-5 w-5 animate-spin" />} Save new password</button>
    </form>
  );
}
