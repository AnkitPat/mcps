import { list_products_tool } from "./list_products.js";
import { get_product_details_tool } from "./get_product_details.js";
import { compare_products_tool } from "./compare_products.js";
import { get_orders_tool } from "./get_orders.js";
import { submit_order_tool } from "./submit_order.js";
const allTools = [
    list_products_tool,
    get_product_details_tool,
    compare_products_tool,
    get_orders_tool,
    submit_order_tool,
];
export function registerTools(server) {
    for (const tool of allTools) {
        server.registerTool(tool.name, tool.schema, async (args) => {
            try {
                const result = await tool.execute(args);
                // Ensure it's in the correct shape
                if (typeof result === 'object' && result !== null && 'content' in result) {
                    return result;
                }
                return {
                    content: [{ type: "text", text: typeof result === 'string' ? result : JSON.stringify(result, null, 2) }]
                };
            }
            catch (error) {
                return {
                    isError: true,
                    content: [{ type: "text", text: "Error: " + error.message }]
                };
            }
        });
    }
    console.log("Registered tools:");
    allTools.forEach((tool) => console.log(`- ${tool.name}`));
    console.log(`Total tools registered: ${allTools.length}`);
}
