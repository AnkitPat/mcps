import { z } from "zod";
import { getOrdersByUserId } from "../dal.js";
import { Order } from "../types/order.js";

export const getOrdersInputSchema = {
  userId: z.string().optional().describe("User ID to fetch orders for. Defaults to 'demo-user'."),
};

export function getOrders(args: { userId?: string }): Order[] {
  const userId = args.userId ?? "demo-user";
  return getOrdersByUserId(userId);
}
