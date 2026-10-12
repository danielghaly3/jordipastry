import { NextResponse, type NextRequest } from "next/server";
import { applyOrderFilters } from "@/lib/admin-orders";
import { getAdmin } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";

// Prevents spreadsheet formula injection (cells starting with = + - @ are treated as text).
const cell = (v: unknown) => {
  let s = v === null || v === undefined ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

export async function GET(request: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  const f = Object.fromEntries(request.nextUrl.searchParams);
  const base = admin.supabase
    .from("orders")
    .select("order_number,created_at,customer_name,customer_phone,customer_whatsapp,fulfillment_method,delivery_area_name,delivery_address,requested_for,subtotal,delivery_fee,total,payment_method,payment_status,fulfillment_status,notes,items:order_items(name,quantity)");
  const { data, error } = await applyOrderFilters(base, f).order("created_at", { ascending: false }).limit(5000);
  if (error) return NextResponse.json({ error: "Export failed" }, { status: 500 });

  const header = ["Order", "Placed (Cairo)", "Customer", "Phone", "WhatsApp", "Method", "Area", "Address", "Requested for", "Items", "Subtotal (EGP)", "Delivery (EGP)", "Total (EGP)", "Payment method", "Payment status", "Order status", "Notes"];
  const rows = (data ?? []).map((o) => [
    o.order_number, formatDateTime(o.created_at), o.customer_name, o.customer_phone, o.customer_whatsapp, o.fulfillment_method, o.delivery_area_name, o.delivery_address,
    formatDateTime(o.requested_for), (o.items as { name: string; quantity: number }[]).map((i) => `${i.quantity}x ${i.name}`).join("; "),
    o.subtotal, o.delivery_fee, o.total, o.payment_method, o.payment_status, o.fulfillment_status, o.notes,
  ]);
  const csv = "﻿" + [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="jordi-orders-${new Date().toISOString().slice(0, 10)}.csv"`,
      "cache-control": "no-store",
    },
  });
}
