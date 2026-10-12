import { z } from "zod";

export const orderItemSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("product"),
    product_id: z.uuid(),
    quantity: z.number().int().min(1).max(20),
    variant_id: z.uuid().nullable().optional(),
    topping_ids: z.array(z.uuid()).max(12).default([]),
  }),
  z.object({
    type: z.literal("box"),
    box_size_id: z.uuid(),
    quantity: z.number().int().min(1).max(20),
    contents: z.array(z.object({ product_id: z.uuid(), quantity: z.number().int().min(1).max(48) })).min(1).max(48),
  }),
]);

export const quoteSchema = z.object({
  items: z.array(orderItemSchema).min(1).max(30),
  fulfillment_method: z.enum(["delivery", "pickup"]),
  delivery_area_id: z.uuid().nullable().optional(),
  payment_method: z.enum(["instapay", "cash"]),
});

export const checkoutSchema = quoteSchema.extend({
  idempotency_key: z.uuid(),
  name: z.string().trim().min(2, "Please enter your name").max(80),
  phone: z.string().trim().min(1, "Please enter your phone number").max(30),
  whatsapp: z.string().trim().max(30).optional().default(""),
  delivery_address: z.string().trim().max(300).optional().default(""),
  requested_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  requested_time: z.string().regex(/^\d{2}:\d{2}$/).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().default(""),
  website: z.string().max(0).optional().default(""), // honeypot: real people never fill this
}).refine((d) => !d.requested_date || !!d.requested_time, { message: "Please pick a time for your chosen day.", path: ["requested_time"] });

export type CheckoutInput = z.input<typeof checkoutSchema>;
export type Quote = {
  lines: { name: string; quantity: number; unit_price: number; line_total: number; options: { name: string }[]; box_contents: { name: string; quantity: number }[] }[];
  subtotal: number;
  delivery_fee: number;
  total: number;
};
