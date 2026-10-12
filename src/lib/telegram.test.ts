import { describe, expect, it } from "vitest";
import { buildOrderMessage, escapeHtml, itemLine } from "./telegram";
import type { Order } from "./types";

const order: Order = {
  id: "11111111-1111-1111-1111-111111111111",
  order_number: "JP-000105",
  public_token: "x".repeat(64),
  customer_name: "Ahmed <Test> & Co",
  customer_phone: "+201012345678",
  customer_whatsapp: "+201012345678",
  fulfillment_method: "delivery",
  delivery_area_name: "Zone A",
  delivery_address: "12 Street",
  requested_for: null,
  notes: "Ring twice",
  subtotal: 300,
  delivery_fee: 50,
  total: 350,
  payment_method: "instapay",
  payment_status: "pending",
  fulfillment_status: "received",
  created_at: "2026-10-11T10:00:00Z",
  updated_at: "2026-10-11T10:00:00Z",
};
const items = [
  { quantity: 2, name: "Chocolate Donut", options: [], box_contents: [] },
  { quantity: 1, name: "Box of 6", options: [], box_contents: [{ product_id: "a", name: "Glazed", quantity: 6, surcharge: 0 }] },
];

describe("buildOrderMessage", () => {
  it("builds the new-order alert with escaped data and both buttons", () => {
    const msg = buildOrderMessage("order_created", order, items, { siteUrl: "https://jordi.example" });
    expect(msg.text).toContain("🍩 <b>NEW JORDI ORDER</b>");
    expect(msg.text).toContain("<b>Order:</b> #JP-000105");
    expect(msg.text).toContain("Ahmed &lt;Test&gt; &amp; Co");
    expect(msg.text).toContain("• 2 × Chocolate Donut");
    expect(msg.text).toContain("• 1 × Box of 6: 6× Glazed");
    expect(msg.text).toContain("<b>Total:</b> EGP 350");
    expect(msg.text).toContain("<b>Payment Status:</b> Pending Payment");
    expect(msg.text).toContain("<b>Notes:</b> Ring twice");
    const [view, wa] = msg.reply_markup!.inline_keyboard;
    expect(view[0].url).toBe("https://jordi.example/admin/orders/11111111-1111-1111-1111-111111111111");
    expect(wa[0].url).toMatch(/^https:\/\/wa\.me\/201012345678\?text=Hi%20Ahmed!%20This%20is%20Jordi%20Pastry/);
    expect(decodeURIComponent(wa[0].url)).toContain("We've received your order #JP-000105. We'll confirm it as soon as your payment is verified.");
  });

  it("drops the admin button when the site URL is not public https", () => {
    const msg = buildOrderMessage("order_created", order, items, { siteUrl: "http://localhost:3000" });
    expect(msg.reply_markup!.inline_keyboard).toHaveLength(1);
  });

  it("payment report mentions amount, reference and receipt", () => {
    const msg = buildOrderMessage("payment_reported", { ...order, payment_status: "reported" }, items, {
      siteUrl: "https://x.y",
      payment: { reference: "TX<1>", has_receipt: true },
    });
    expect(msg.text).toContain("sent <b>EGP 350</b> via InstaPay");
    expect(msg.text).toContain("Reference: TX&lt;1&gt;");
    expect(msg.text).toContain("Receipt uploaded: yes");
    expect(msg.text).not.toContain("<b>Products:</b>");
  });
});

it("helpers", () => {
  expect(escapeHtml("<a&b>")).toBe("&lt;a&amp;b&gt;");
  expect(itemLine({ quantity: 1, name: "Boston", options: [{ id: "1", kind: "variant", name: "Mini", price_delta: 0 }], box_contents: [] })).toBe("1 × Boston (Mini)");
});

describe("sendTelegram", () => {
  it("posts HTML with inline buttons to the configured chat and hides the token in errors", async () => {
    const { sendTelegram } = await import("./telegram");
    const { vi } = await import("vitest");
    process.env.TELEGRAM_BOT_TOKEN = "123:SECRET";
    process.env.TELEGRAM_CHAT_ID = "999";
    const calls: { url: string; body: Record<string, unknown> }[] = [];
    vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
      calls.push({ url, body: JSON.parse(String(init.body)) });
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });
    await sendTelegram({ text: "<b>hi</b>", reply_markup: { inline_keyboard: [[{ text: "x", url: "https://wa.me/1" }]] } });
    expect(calls[0].url).toBe("https://api.telegram.org/bot123:SECRET/sendMessage");
    expect(calls[0].body).toMatchObject({ chat_id: "999", parse_mode: "HTML", text: "<b>hi</b>" });
    expect((calls[0].body.reply_markup as { inline_keyboard: unknown[] }).inline_keyboard).toHaveLength(1);

    vi.stubGlobal("fetch", async () => { throw new Error("connect failed for https://api.telegram.org/bot123:SECRET/sendMessage"); });
    await expect(sendTelegram({ text: "x" })).rejects.toThrow("bot[token]/sendMessage");
    vi.stubGlobal("fetch", async () => new Response(JSON.stringify({ ok: false, description: "Bad Request: chat not found" }), { status: 400 }));
    await expect(sendTelegram({ text: "x" })).rejects.toThrow("chat not found");
    vi.unstubAllGlobals();
  });
});
