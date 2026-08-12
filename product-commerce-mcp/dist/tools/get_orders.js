import { z } from "zod";
import { orders } from "../data/orders.js";
export const getOrdersInputSchema = {
    userId: z.string().optional().describe("User ID to fetch orders for. Defaults to 'demo-user'."),
};
export function getOrders(args) {
    const userId = args.userId ?? "demo-user";
    return orders.filter(o => o.userId === userId);
}
