import { firstName } from "./format";
import type { Order } from "./types";

type O = Pick<Order, "order_number" | "customer_name" | "payment_method" | "payment_status" | "fulfillment_status" | "fulfillment_method">;

/** Ready-to-send WhatsApp text from the owner to the customer, matched to where the order is. */
export function ownerToCustomerMessage(order: O, storeName = "Jordi Pastry") {
  const hi = `Hi ${firstName(order.customer_name)}! This is ${storeName} 🍩`;
  const no = `#${order.order_number}`;
  if (order.fulfillment_status === "canceled") return `${hi} About your order ${no}: `;
  if (order.payment_status === "rejected") return `${hi} We couldn't find your payment for order ${no} yet. Could you please check the transfer and send us the receipt? Thank you!`;
  if (order.payment_status === "reported") return `${hi} Thanks for sending the payment for order ${no}. We're checking it now and will confirm shortly.`;
  if (order.fulfillment_status === "ready")
    return order.fulfillment_method === "pickup" ? `${hi} Your order ${no} is ready for pickup!` : `${hi} Your order ${no} is packed and ready to go!`;
  if (order.fulfillment_status === "out_for_delivery") return `${hi} Your order ${no} is on its way!`;
  if (order.fulfillment_status === "preparing") return `${hi} Good news! We're preparing your order ${no} now.`;
  if (order.payment_status === "pending" && order.payment_method === "instapay")
    return `${hi} We've received your order ${no}. We'll confirm it as soon as your payment is verified. Thank you!`;
  return `${hi} We've received your order ${no}. Thank you!`;
}

/** Text a customer sends to the shop from the tracking page. */
export const customerToShopMessage = (orderNumber: string) => `Hi! I have a question about my order #${orderNumber}.`;
