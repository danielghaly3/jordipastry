"use client";
/* eslint-disable @next/next/no-img-element */
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { saveSetting } from "@/app/admin/actions/settings";
import { btn } from "@/components/ui/button";
import type { SettingsKey } from "@/lib/settings";
import { uploadImage } from "@/lib/upload";

/** Local form state for one settings document + a save that validates on the server. */
export function useSettingForm<T extends Record<string, unknown>>(key: SettingsKey, initial: T) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof T>(k: K, v: T[K]) => setValues((s) => ({ ...s, [k]: v }));
  const save = async (extra?: Partial<T>) => {
    setSaving(true);
    const next = { ...values, ...extra };
    const res = await saveSetting(key, next);
    setSaving(false);
    if (!res.ok) { toast.error(res.error); return false; }
    setSaved(next);
    setValues(next);
    toast.success("Saved! Your website is updated.");
    router.refresh();
    return true;
  };
  return { values, set, save, saving, dirty: JSON.stringify(values) !== JSON.stringify(saved) };
}

export function SaveBar({ dirty, saving, onSave, label = "Save changes" }: { dirty: boolean; saving: boolean; onSave: () => void; label?: string }) {
  return (
    <div className="sticky bottom-20 z-10 mt-6 flex items-center justify-end gap-3 rounded-[18px] bg-white/95 p-3 ring-1 ring-line backdrop-blur lg:bottom-4">
      <span className={`mr-auto text-sm font-semibold ${dirty ? "text-warn" : "text-cocoa-muted"}`}>{dirty ? "Unsaved changes" : "All changes saved"}</span>
      <button type="button" onClick={onSave} disabled={saving || !dirty} className={btn("primary", "md")}>{saving && <Loader2 className="h-4 w-4 animate-spin" />} {label}</button>
    </div>
  );
}

export function ImageField({ label, value, onChange, folder, hint, accept = "image/jpeg,image/png,image/webp", square = false }: {
  label: string; value: string; onChange: (url: string) => void; folder: string; hint?: string; accept?: string; square?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <div>
      <p className="text-sm font-bold">{label}</p>
      <div className="mt-2 flex items-center gap-3">
        <div className={`grid shrink-0 place-items-center overflow-hidden rounded-[14px] bg-cream ring-1 ring-line ${square ? "h-20 w-20" : "h-20 w-32"}`}>
          {busy ? <Loader2 className="h-5 w-5 animate-spin text-pink-ink" /> : value ? <img src={value} alt="" className="h-full w-full object-contain" /> : <span className="px-2 text-center text-xs text-cocoa-muted">None</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => input.current?.click()} disabled={busy} className={btn("secondary", "sm")}><ImagePlus className="h-4 w-4" /> {value ? "Replace" : "Upload"}</button>
          {value && <button type="button" onClick={() => onChange("")} className={btn("ghost", "sm", "text-bad")}><Trash2 className="h-4 w-4" /> Remove</button>}
        </div>
      </div>
      {hint && <p className="mt-1 text-sm text-cocoa-muted">{hint}</p>}
      <input ref={input} type="file" accept={accept} className="sr-only" onChange={async (e) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        setBusy(true);
        try { onChange((await uploadImage("site-assets", folder, file, square ? 512 : 1800)).url); }
        catch (err) { toast.error(err instanceof Error ? err.message : "Upload failed"); }
        finally { setBusy(false); }
      }} />
    </div>
  );
}
