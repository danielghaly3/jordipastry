"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Paperclip, Send, X } from "lucide-react";
import { toast } from "sonner";
import { createReceiptUpload, reportPayment } from "@/app/(store)/order/actions";
import { inputClass } from "@/components/checkout/field";
import { btn } from "@/components/ui/button";
import { compressImage } from "@/lib/image-compress";
import { createBrowserSupabase } from "@/lib/supabase/browser";

export function ReportPayment({ token, again = false }: { token: string; again?: boolean }) {
  const router = useRouter();
  const [reference, setReference] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setBusy(true);
    setError("");
    let receiptPath: string | null = null;
    if (file) {
      const upload = await compressImage(file);
      if (upload.size > 5 * 1024 * 1024) { setBusy(false); setError("That file is over 5 MB. Please choose a smaller one."); return; }
      const slot = await createReceiptUpload(token, upload.type);
      if (!slot.ok) { setBusy(false); setError(slot.error); return; }
      const { error: upErr } = await createBrowserSupabase().storage.from("payment-receipts").uploadToSignedUrl(slot.data.path, slot.data.uploadToken, upload, { contentType: upload.type });
      if (upErr) { setBusy(false); setError("The receipt didn't upload. Try again, or send without it."); return; }
      receiptPath = slot.data.path;
    }
    const res = await reportPayment({ token, reference, receiptPath });
    setBusy(false);
    if (!res.ok) { setError(res.error); toast.error(res.error); return; }
    toast.success("Thanks! We'll confirm as soon as we see your transfer.");
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-1.5">
        <label htmlFor="ref" className="font-semibold">Transaction reference <span className="font-normal text-cocoa-muted">(optional)</span></label>
        <input id="ref" className={inputClass} value={reference} onChange={(e) => setReference(e.target.value)} maxLength={120} placeholder="From your InstaPay confirmation" />
      </div>
      <div>
        <span className="font-semibold">Receipt screenshot <span className="font-normal text-cocoa-muted">(optional)</span></span>
        {file ? (
          <div className="mt-2 flex items-center justify-between gap-2 rounded-2xl bg-pink-tint px-4 py-3">
            <span className="truncate text-sm">{file.name}</span>
            <button type="button" onClick={() => setFile(null)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-white" aria-label="Remove file"><X className="h-4 w-4" /></button>
          </div>
        ) : (
          <label className="mt-2 flex h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-pink-soft font-semibold text-pink-ink hover:bg-pink-tint">
            <Paperclip className="h-4 w-4" /> Attach screenshot or PDF
            <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
        )}
        <p className="mt-1 text-sm text-cocoa-muted">Only the shop owner can see it.</p>
      </div>
      {error && <p className="rounded-2xl bg-bad-tint px-4 py-3 text-sm font-semibold text-bad" role="alert">{error}</p>}
      <button type="button" onClick={submit} disabled={busy} className={btn("primary", "lg", "w-full")}>
        {busy ? <><Loader2 className="h-5 w-5 animate-spin" /> Sending...</> : <><Send className="h-5 w-5" /> {again ? "I've Sent the Payment Again" : "I've Sent the Payment"}</>}
      </button>
    </div>
  );
}
