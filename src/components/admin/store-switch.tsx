"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveSetting } from "@/app/admin/actions/settings";
import { Toggle } from "@/components/admin/controls";

export function StoreSwitch({ open }: { open: boolean }) {
  const [value, setValue] = useState(open);
  const [, start] = useTransition();
  const router = useRouter();
  return (
    <div className={`rounded-[20px] p-5 ring-1 ${value ? "bg-good-tint ring-good/20" : "bg-bad-tint ring-bad/20"}`}>
      <Toggle
        checked={value}
        label={value ? "Accepting orders" : "Orders are closed"}
        description={value ? "Customers can order now. Switch off to pause orders." : "Customers see your closure message. Switch on to reopen."}
        onChange={async (v) => {
          setValue(v);
          const res = await saveSetting("store", { accepting_orders: v });
          if (!res.ok) { setValue(!v); toast.error(res.error); return; }
          toast.success(v ? "You're open for orders" : "Orders paused");
          start(() => router.refresh());
        }}
      />
    </div>
  );
}
