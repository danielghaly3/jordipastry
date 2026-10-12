export type Category = { id: string; name: string; slug: string; sort_order: number; is_visible: boolean };

export type ProductOption = { id: string; kind: "variant" | "topping"; name: string; price_delta: number; is_available: boolean; sort_order: number };
export type ProductImage = { id: string; storage_path: string; alt: string | null; sort_order: number };

export type Product = {
  id: string;
  slug: string;
  name: string;
  name_ar: string | null;
  description: string;
  price: number;
  sale_price: number | null;
  flavor: string | null;
  ingredients: string | null;
  allergens: string[];
  is_visible: boolean;
  is_sold_out: boolean;
  is_featured: boolean;
  stock_quantity: number | null;
  box_surcharge: number;
  sort_order: number;
  is_sample: boolean;
  archived_at: string | null;
  category_id: string | null;
  category: Pick<Category, "id" | "name" | "slug"> | null;
  images: ProductImage[];
  options: ProductOption[];
};

export type BoxSize = { id: string; name: string; description: string; slots: number; price: number; is_active: boolean; sort_order: number; eligible: string[] };
export type DeliveryArea = { id: string; name: string; fee: number; is_active: boolean; sort_order: number };
export type Review = { id: string; display_name: string; rating: number; body: string; created_at: string; verified: boolean; card_style: string; treat: string };

export type FulfillmentStatus = "received" | "preparing" | "ready" | "out_for_delivery" | "completed" | "canceled";
export type PaymentStatus = "pending" | "reported" | "verified" | "rejected" | "refunded";

export type OrderItem = {
  id: string;
  kind: "product" | "box";
  product_id: string | null;
  box_size_id: string | null;
  name: string;
  unit_price: number;
  quantity: number;
  line_total: number;
  options: { id: string; kind: string; name: string; price_delta: number }[];
  box_contents: { product_id: string; name: string; quantity: number; surcharge: number }[];
};

export type Order = {
  id: string;
  order_number: string;
  public_token: string;
  customer_name: string;
  customer_phone: string;
  customer_whatsapp: string;
  fulfillment_method: "delivery" | "pickup";
  delivery_area_name: string | null;
  delivery_address: string | null;
  requested_for: string | null;
  notes: string | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  payment_method: "instapay" | "cash";
  payment_status: PaymentStatus;
  fulfillment_status: FulfillmentStatus;
  created_at: string;
  updated_at: string;
};

export const isAvailable = (p: Pick<Product, "is_sold_out" | "stock_quantity">) =>
  !p.is_sold_out && (p.stock_quantity === null || p.stock_quantity > 0);

export const effectivePrice = (p: Pick<Product, "price" | "sale_price">) => p.sale_price ?? p.price;
