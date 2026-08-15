## First part for handling MCP


app.post("/mcp", async (req, res) => {
  try {
    const sessionId =
      req.headers["mcp-session-id"] as string | undefined;

    let transport: StreamableHTTPServerTransport;

    if (sessionId && transports[sessionId]) {
      transport = transports[sessionId];
    } else if (
      !sessionId &&
      isInitializeRequest(req.body)
    ) {
      transport =
        new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),

          onsessioninitialized: (newSessionId) => {
            transports[newSessionId] = transport;
          }
        });

      transport.onclose = () => {
        if (transport.sessionId) {
          delete transports[transport.sessionId];
        }
      };

      const server = createServer();

      await server.connect(transport);
    } else {
      res.status(400).json({
        error: "Invalid MCP session"
      });

      return;
    }

    await transport.handleRequest(
      req,
      res,
      req.body
    );
  } catch (error) {
    console.error("MCP request failed:", error);

    if (!res.headersSent) {
      res.status(500).json({
        error: "Internal server error"
      });
    }
  }
});

## to get and delete endpoints of MCP

app.get("/mcp", async (req, res) => {
  const sessionId =
    req.headers["mcp-session-id"] as string | undefined;

  if (!sessionId || !transports[sessionId]) {
    res.status(400).send(
      "Missing or invalid MCP session"
    );

    return;
  }

  await transports[sessionId].handleRequest(
    req,
    res
  );
});

app.delete("/mcp", async (req, res) => {
  const sessionId =
    req.headers["mcp-session-id"] as string | undefined;

  if (!sessionId || !transports[sessionId]) {
    res.status(400).send(
      "Missing or invalid MCP session"
    );

    return;
  }

  await transports[sessionId].handleRequest(
    req,
    res
  );
});

## add and creating server


const transports: Record<
  string,
  StreamableHTTPServerTransport
> = {};

function createServer() {
  const server = new McpServer({
    name: "product-commerce-mcp",
    version: "1.0.0"
  });

  registerTools(server);

  return server;
}

## Defining list tools

import { z } from "zod";
import { listProducts as dalListProducts } from "../dal.js";

export const listProductsInputSchema = z.object({
  query: z
    .string()
    .optional()
    .describe("Search term for product name, brand or description"),

  category: z
    .string()
    .optional()
    .describe("Product category"),

  minPrice: z
    .number()
    .optional()
    .describe("Minimum price"),

  maxPrice: z
    .number()
    .optional()
    .describe("Maximum price"),

  limit: z
    .number()
    .int()
    .min(1)
    .max(50)
    .default(10)
    .describe("Maximum number of products to return")
});

export function listProducts(args: {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
}) {
  return dalListProducts(args);
}

export const list_products_tool = {
  name: "list_products",
  schema: {
    title: "List Products",
    description: "Search and list products available for purchase.",
    inputSchema: listProductsInputSchema,
    annotations: {
      readOnlyHint: true,
      openWorldHint: false,
      destructiveHint: false,
    },
  },
  execute: listProducts,
};

## Registering tools

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { list_products_tool } from "./list_products.js";

const allTools = [
  list_products_tool,
];

export function registerTools(server: McpServer) {
  for (const tool of allTools) {
    server.registerTool(
      tool.name,
      tool.schema as any,
      async (args: any) => {
        try {
          const result = await tool.execute(args);
          // Ensure it's in the correct shape
          if (typeof result === 'object' && result !== null && 'content' in result) {
            return result as any;
          }
          return {
            content: [{ type: "text", text: typeof result === 'string' ? result : JSON.stringify(result, null, 2) }]
          };
        } catch (error: any) {
          return {
            isError: true,
            content: [{ type: "text", text: "Error: " + error.message }]
          };
        }
      }
    );
  }

  console.log("Registered tools:");
  allTools.forEach((tool) => console.log(`- ${tool.name}`));
  console.log(`Total tools registered: ${allTools.length}`);
}
## Code for other tools


## adding more tools

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { list_products_tool } from "./list_products.js";
import { get_product_details_tool } from "./get_product_details.js";
import { compare_products_tool } from "./compare_products.js";
import { get_orders_tool } from "./get_orders.js";

const allTools = [
  list_products_tool,
  get_product_details_tool,
  compare_products_tool,
  get_orders_tool,
];

export function registerTools(server: McpServer) {
  for (const tool of allTools) {
    server.registerTool(
      tool.name,
      tool.schema as any,
      async (args: any) => {
        try {
          const result = await tool.execute(args);
          // Ensure it's in the correct shape
          if (typeof result === 'object' && result !== null && 'content' in result) {
            return result as any;
          }
          return {
            content: [{ type: "text", text: typeof result === 'string' ? result : JSON.stringify(result, null, 2) }]
          };
        } catch (error: any) {
          return {
            isError: true,
            content: [{ type: "text", text: "Error: " + error.message }]
          };
        }
      }
    );
  }

  console.log("Registered tools:");
  allTools.forEach((tool) => console.log(`- ${tool.name}`));
  console.log(`Total tools registered: ${allTools.length}`);
}



## for adding other routes

# index.html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Example Website</title>
    <style>
        body { font-family: sans-serif; line-height: 1.6; padding: 2rem; max-width: 800px; margin: 0 auto; }
    </style>
</head>
<body>
    <h1>Welcome to Example</h1>
    <p>This is a demo page.</p>
    <ul>
        <li><a href="/support">Support</a></li>
        <li><a href="/privacy">Privacy Policy</a></li>
        <li><a href="/terms">Terms of Service</a></li>
    </ul>
</body>
</html>

# privacy.html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Privacy Policy</title>
</head>
<body>
    <h1>Privacy Policy</h1>
    <p>We respect your privacy.</p>
    <a href="/">Back to Home</a>
</body>
</html>


# support.html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Support</title>
</head>
<body>
    <h1>Customer Support</h1>
    <p>Contact us at support@example.com</p>
    <a href="/">Back to Home</a>
</body>
</html>

# terms.html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Terms of Service</title>
</head>
<body>
    <h1>Terms of Service</h1>
    <p>By using this service, you agree to our terms.</p>
    <a href="/">Back to Home</a>
</body>
</html>


app.use(express.static("public"));

app.get("/support", (_req, res) => res.sendFile("support.html", { root: "public" }));
app.get("/privacy", (_req, res) => res.sendFile("privacy.html", { root: "public" }));
app.get("/terms", (_req, res) => res.sendFile("terms.html", { root: "public" }));
app.get("/.well-known/openai-apps-challenge", (_req, res) => res.send("PVZEeBRVNjJCzfqf1DtVgYI9up6GvEyh3egLW34lKBk"));
