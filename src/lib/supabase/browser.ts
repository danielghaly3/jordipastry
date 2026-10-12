"use client";
import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/env";

// Used by the admin for direct-to-storage image uploads (storage policies check is_admin()).
export const createBrowserSupabase = () => createBrowserClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
