import { z } from "zod";

export const productInputSchema = z
  .object({
    id: z.uuid().optional(),
    name: z.string().trim().min(1, "Please give the product a name").max(80),
    name_ar: z.string().trim().max(80).default(""),
    description: z.string().trim().max(1000).default(""),
    price: z.number({ message: "Please enter a price" }).min(0).max(100000),
    sale_price: z.number().min(0).max(100000).nullable().default(null),
    category_id: z.uuid().nullable().default(null),
    flavor: z.string().trim().max(60).default(""),
    ingredients: z.string().trim().max(1000).default(""),
    allergens: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
    is_visible: z.boolean().default(true),
    is_sold_out: z.boolean().default(false),
    is_featured: z.boolean().default(false),
    stock_quantity: z.number().int().min(0).max(100000).nullable().default(null),
    box_surcharge: z.number().min(0).max(10000).default(0),
    images: z.array(z.object({ storage_path: z.string().regex(/^products\/[\w-]+\.(webp|jpe?g|png|avif)$/), alt: z.string().max(160).nullable().default(null) })).max(8).default([]),
    options: z
      .array(z.object({ id: z.uuid().optional(), kind: z.enum(["variant", "topping"]), name: z.string().trim().min(1, "Every option needs a name").max(60), price_delta: z.number().min(0).max(10000), is_available: z.boolean() }))
      .max(30)
      .default([]),
    box_ids: z.array(z.uuid()).default([]),
  })
  .refine((p) => p.sale_price === null || p.sale_price < p.price, { message: "The sale price must be lower than the normal price", path: ["sale_price"] });

export type ProductInput = z.input<typeof productInputSchema>;
