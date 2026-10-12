// Maps database error codes (raised in place_order etc.) to friendly customer/owner messages.
const MESSAGES: Record<string, (detail?: string) => string> = {
  STORE_CLOSED: () => "We're not taking orders right now. Please check back soon!",
  EMPTY_CART: () => "Your cart is empty.",
  TOO_MANY_ITEMS: () => "That's a lot of donuts! Please message us on WhatsApp for large orders.",
  INVALID_QUANTITY: () => "One of the quantities isn't valid.",
  ITEM_UNAVAILABLE: (d) => `${d ? `"${d}"` : "An item in your cart"} is no longer available. Please remove it and try again.`,
  OPTION_UNAVAILABLE: (d) => `Please choose an available option for ${d ? `"${d}"` : "an item"}.`,
  BOX_INCOMPLETE: (d) => `${d || "Your box"} isn't full yet. Please fill every slot.`,
  BOXES_DISABLED: () => "Custom boxes aren't available right now.",
  OUT_OF_STOCK: (d) => `We don't have enough ${d ? `"${d}"` : "of an item"} left. Please lower the quantity.`,
  DELIVERY_DISABLED: () => "Delivery isn't available right now. Please choose pickup.",
  PICKUP_DISABLED: () => "Pickup isn't available right now. Please choose delivery.",
  AREA_UNAVAILABLE: () => "Please choose a delivery area from the list.",
  ADDRESS_REQUIRED: () => "Please add your delivery address.",
  BELOW_MINIMUM: (d) => `The minimum order is EGP ${d ?? ""}.`,
  INVALID_TIME: () => "Please choose a time in the future.",
  CAPACITY_REACHED: () => "We're fully booked for that day. Please pick another day.",
  RATE_LIMITED: () => "Too many attempts. Please wait a few minutes and try again.",
  PAYMENT_METHOD_UNAVAILABLE: () => "That payment method isn't available right now.",
  ORDER_NOT_FOUND: () => "We couldn't find that order.",
  ORDER_CANCELED: () => "This order was canceled.",
  INVALID_RECEIPT: () => "That receipt upload didn't work. Please try again.",
  INVALID_TRANSITION: () => "That action isn't possible for this order's current status. Refresh and try again.",
  REASON_REQUIRED: () => "Please write a short reason so the customer knows what to fix.",
  NOT_AUTHORIZED: () => "You don't have permission to do that.",
  ALREADY_REVIEWED: () => "You've already reviewed this order. Thank you!",
  NO_LINKS: () => "Please leave out links in your review.",
};

export function friendlyError(error: { message?: string; details?: string | null } | null | undefined, fallback = "Something went wrong. Please try again.") {
  const code = error?.message ?? "";
  const fn = MESSAGES[code];
  return fn ? fn(error?.details ?? undefined) : fallback;
}

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };
export const ok = <T,>(data: T): ActionResult<T> => ({ ok: true, data });
export const fail = (error: string): ActionResult<never> => ({ ok: false, error });
