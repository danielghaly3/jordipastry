"use client";
import { compressImage } from "@/lib/image-compress";
import { publicImageUrl } from "@/lib/env";
import { createBrowserSupabase } from "@/lib/supabase/browser";

const EXT: Record<string, string> = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png", "image/avif": "avif", "image/svg+xml": "svg", "image/x-icon": "ico", "image/vnd.microsoft.icon": "ico" };

/** Compresses (photos only) and uploads to a public bucket as the signed-in admin. Returns the storage path. */
export async function uploadImage(bucket: "product-images" | "site-assets", folder: string, file: File, maxSize = 1600) {
  if (!EXT[file.type]) throw new Error("Please choose a JPG, PNG or WebP image.");
  const upload = file.type === "image/svg+xml" || file.type.includes("icon") ? file : await compressImage(file, maxSize);
  if (upload.size > 5 * 1024 * 1024) throw new Error("That image is too large (max 5 MB).");
  const path = `${folder}/${crypto.randomUUID()}.${EXT[upload.type] ?? "webp"}`;
  const { error } = await createBrowserSupabase().storage.from(bucket).upload(path, upload, { contentType: upload.type, cacheControl: "31536000", upsert: false });
  if (error) throw new Error("Upload failed. Please try again.");
  return { path, url: publicImageUrl(bucket, path) };
}
