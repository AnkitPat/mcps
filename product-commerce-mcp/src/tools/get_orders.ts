import { z } from "zod";
import { getOrdersByUserId } from "../dal.js";
import { Order } from "../types/order.js";

export const getOrdersInputSchema = z.object({
  userId: z.string().describe("User ID to fetch orders for."),
});

export function getOrders(args: { userId: string }): Order[] {
  if (!args.userId) {
    throw new Error("userId is required");
  }
  return getOrdersByUserId(args.userId);
}

export const get_orders_tool = {
  name: "get_orders",
  schema: {
    title: "Get Orders",
    description: "Get orders belonging to the current user.",
    inputSchema: getOrdersInputSchema,
    annotations: {
      readOnlyHint: true,
      openWorldHint: false,
      destructiveHint: false,
    },
  },
  execute: getOrders,
};
