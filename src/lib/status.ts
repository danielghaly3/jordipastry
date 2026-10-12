import type { FulfillmentStatus, PaymentStatus } from "./types";

export const FULFILLMENT_LABEL: Record<FulfillmentStatus, string> = {
  received: "Order Received",
  preparing: "Preparing Your Donuts",
  ready: "Ready",
  out_for_delivery: "Out for Delivery",
  completed: "Completed",
  canceled: "Canceled",
};

// Shorter labels for the owner's dashboard
export const FULFILLMENT_ADMIN_LABEL: Record<FulfillmentStatus, string> = {
  received: "New",
  preparing: "Preparing",
  ready: "Ready",
  out_for_delivery: "Out for delivery",
  completed: "Completed",
  canceled: "Canceled",
};

export const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  pending: "Pending Payment",
  reported: "Payment Reported",
  verified: "Payment Verified",
  rejected: "Payment Rejected",
  refunded: "Refunded",
};

export const PAYMENT_TONE: Record<PaymentStatus, "neutral" | "warn" | "good" | "bad" | "info"> = {
  pending: "neutral",
  reported: "warn",
  verified: "good",
  rejected: "bad",
  refunded: "info",
};

export const FULFILLMENT_TONE: Record<FulfillmentStatus, "neutral" | "warn" | "good" | "bad" | "info"> = {
  received: "warn",
  preparing: "info",
  ready: "info",
  out_for_delivery: "info",
  completed: "good",
  canceled: "bad",
};

export const PAYMENT_METHOD_LABEL = { instapay: "InstaPay", cash: "Cash on delivery / pickup" } as const;

/** Customer-facing timeline for one order. */
export function fulfillmentSteps(method: "delivery" | "pickup"): FulfillmentStatus[] {
  return method === "delivery"
    ? ["received", "preparing", "ready", "out_for_delivery", "completed"]
    : ["received", "preparing", "ready", "completed"];
}

export function customerStepLabel(status: FulfillmentStatus, method: "delivery" | "pickup") {
  if (status === "ready") return method === "pickup" ? "Ready for Pickup" : "Packed & Ready";
  return FULFILLMENT_LABEL[status];
}
