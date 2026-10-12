import "server-only";
import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";

/** Keyed HMAC of the client IP: lets us rate limit without storing raw IP addresses. */
export async function clientIpHash() {
  const h = await headers();
  // Vercel sets x-vercel-forwarded-for itself (clients can't spoof it); others are fallbacks for other hosts.
  const ip = h.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  return createHmac("sha256", process.env.SUPABASE_SECRET_KEY ?? "jordi").update(ip).digest("hex").slice(0, 32);
}

/** Returns true when allowed. By default fails open if the database errors (ordering must not break because of the limiter). */
export async function rateLimit(action: string, max: number, windowSeconds: number, failClosed = false) {
  const key = `${action}:${await clientIpHash()}`;
  const { data, error } = await createServiceClient().rpc("hit_rate_limit", { p_key: key, p_max: max, p_window_seconds: windowSeconds });
  if (error) {
    console.error("rate limit check failed", error.message);
    return !failClosed;
  }
  return data === true;
}
