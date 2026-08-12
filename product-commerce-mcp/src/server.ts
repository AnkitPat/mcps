import express from "express";
import { randomUUID } from "node:crypto";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  StreamableHTTPServerTransport
} from "@modelcontextprotocol/sdk/server/streamableHttp.js";

import {
  isInitializeRequest
} from "@modelcontextprotocol/sdk/types.js";
import { listProducts, listProductsInputSchema } from "./tools/list_products.js";


import {
  getProductDetailsInputSchema,
  getProductDetails
} from "./tools/get_product_details.js";

import {
  compareProductsInputSchema,
  compareProducts
} from "./tools/compare_products.js";

// import {
//   orderProductInputSchema,
//   orderProduct
// } from "./tools/order-product.js";

// import {
//   getOrdersInputSchema,
//   getOrders
// } from "./tools/get-orders.js";

const app = express();

app.use(express.json());

const PORT = Number(process.env.PORT ?? 3000);

const transports: Record<
  string,
  StreamableHTTPServerTransport
> = {};

function createServer() {
  const server = new McpServer({
    name: "product-commerce-mcp",
    version: "1.0.0"
  });

  server.tool(
    "list_products",
    "Search and list products available for purchase.",
    listProductsInputSchema,
    async (args) => {
      const result = listProducts(args);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    }
  );

server.tool(
  "get_product_details",
  "Get complete details for a specific product.",
  getProductDetailsInputSchema,
  async (args) => {
    const result = getProductDetails(args as any);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }
);


server.tool(
  "compare_products",
  "Compare multiple products across price, rating and attributes.",
  compareProductsInputSchema,
  async (args) => {
    const result = compareProducts(args);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }
);

//   server.tool(
//     "order_product",
//     "Place an order for a product.",
//     orderProductInputSchema,
//     async (args) => {
//       const result = orderProduct(args);

//       return {
//         content: [
//           {
//             type: "text",
//             text: JSON.stringify(result, null, 2)
//           }
//         ]
//       };
//     }
//   );

//   server.tool(
//     "get_orders",
//     "Get orders belonging to the current user.",
//     getOrdersInputSchema,
//     async (args) => {
//       const result = getOrders(args);

//       return {
//         content: [
//           {
//             type: "text",
//             text: JSON.stringify(result, null, 2)
//           }
//         ]
//       };
//     }
//   );

  return server;
}

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

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "product-commerce-mcp"
  });
});

app.listen(PORT, () => {
  console.log(
    `Product Commerce MCP running on http://localhost:${PORT}`
  );

  console.log(
    `MCP endpoint: http://localhost:${PORT}/mcp`
  );
});