import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { toolRegistry } from "./tools/registry.js";
import express from "express";
import cors from "cors";
import crypto from "crypto";
import { randomUUID } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";

const app = express();
app.use(cors());
app.use(express.json({
  type: [
    "application/json",
    "application/*+json"
  ]
}));

const streamableTransports: Record<
  string,
  StreamableHTTPServerTransport
> = {};
const transportMap = new Map<string, SSEServerTransport>();

function createServer(): McpServer {
  const server = new McpServer({ name: "kubernetes-mcp", version: "1.0.0" });
  
  // Register tools dynamically from the registry
  for (const tool of toolRegistry) {
    // Wrap execute to log tool invocation
    const originalExecute = tool.execute;
    const wrappedExecute = async (args: any) => {
      const start = Date.now();
      console.log(`[Tool] Invoking ${tool.name} with args:`, JSON.stringify(args));
      try {
        const result = await originalExecute(args);
        console.log(`[Tool] ${tool.name} success (duration: ${Date.now() - start}ms)`);
        return result;
      } catch (error) {
        console.error(`[Tool] ${tool.name} failed (duration: ${Date.now() - start}ms):`, error);
        throw error;
      }
    };

    server.registerTool(tool.name, tool.schema as any, wrappedExecute);
  }
  
  return server;
}

// Log registered tools on startup
console.log("MCP Server Started");
console.log("Registered tools:");
toolRegistry.forEach(tool => console.log(`- ${tool.name}`));
console.log(`Total tools registered: ${toolRegistry.length}`);

app.get("/sse", async (req, res) => {
  const sessionId = crypto.randomUUID();
  console.log(`[${sessionId}] SSE connection request. tools/list requested.`);
  console.log(`Returning ${toolRegistry.length} tools.`);
  
  const server = createServer();
  const transport = new SSEServerTransport(`/messages/${sessionId}`, res);
  transportMap.set(sessionId, transport);
  
  try {
    await server.connect(transport);
  } catch (error) {
    console.error(`[${sessionId}] Connection error:`, error);
    transportMap.delete(sessionId);
    res.status(500).send("Connection error");
    return;
  }
  
  req.on("close", () => {
    console.log(`[${sessionId}] Connection closed`);
    transportMap.delete(sessionId);
  });
});

app.post("/messages/:sessionId", async (req, res) => {
  const transport = transportMap.get(req.params.sessionId);
  if (!transport) {
    res.status(404).send("Session not found");
    return;
  }
  try {
    await transport.handlePostMessage(req, res);
  } catch (error) {
    console.error("Message handling error:", error);
    res.status(500).send("Internal server error");
  }
});

app.post("/sse", (req, res) => {
  console.log("POST /sse");
  console.log(req.headers);

  res.status(501).send("Not implemented");
});

// app.use((req, res) => {
//   console.log(`Unhandled request: ${req.method} ${req.originalUrl}`);

//   res.status(404).json({
//     message: 'Route not found'
//   });
// });
app.post("/mcp", async (req, res) => {
  console.log("\n========================================");
  console.log("POST /mcp");
  console.log("Headers:");
  console.dir(req.headers, { depth: null });

  console.log("Body:");
  console.dir(req.body, { depth: null });
  console.log("========================================");

  // ---- Intercept outgoing response ----
  const originalWrite = res.write.bind(res);
  const originalEnd = res.end.bind(res);

  (res as any).write = (chunk: any, ...args: any[]) => {
    console.log("\n========== RESPONSE WRITE ==========");
console.log(Buffer.from(chunk).toString("utf8"));
    console.log("====================================\n");

    return originalWrite(chunk, ...args);
  };

  (res as any).end = (chunk?: any, ...args: any[]) => {
    if (chunk) {
      console.log("\n========== RESPONSE END ==========");
      console.log(Buffer.from(chunk).toString("utf8"));
      console.log("==================================\n");
    }

    return originalEnd(chunk, ...args);
  };

  const sessionId = req.headers["mcp-session-id"] as string | undefined;

  let transport: StreamableHTTPServerTransport;

  if (sessionId && streamableTransports[sessionId]) {
    console.log("[MCP] Existing session:", sessionId);
    transport = streamableTransports[sessionId];
  } else if (!sessionId && isInitializeRequest(req.body)) {
    console.log("[MCP] Initialize request");

    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),

      onsessioninitialized(id) {
        console.log("[MCP] Session created:", id);
        streamableTransports[id] = transport;
      },
    });

    transport.onclose = () => {
      console.log("[MCP] Session closed:", transport.sessionId);

      if (transport.sessionId) {
        delete streamableTransports[transport.sessionId];
      }
    };

    const server = createServer();
    await server.connect(transport);
  } else {
    console.log("[MCP] Invalid session");

    res.status(400).json({
      jsonrpc: "2.0",
      id: null,
      error: {
        code: -32000,
        message: "Invalid session",
      },
    });

    return;
  }

  console.log("[MCP] Calling transport.handleRequest()");

  await transport.handleRequest(req, res, req.body);

  console.log("[MCP] transport.handleRequest() completed");
});

app.get("/mcp", async (req, res) => {
  console.log("\n========================================");
  console.log("GET /mcp");
  console.dir(req.headers, { depth: null });
  console.log("========================================");

  const sessionId = req.headers["mcp-session-id"] as string | undefined;

  if (!sessionId || !streamableTransports[sessionId]) {
    console.log("[MCP] Unknown session:", sessionId);
    res.status(404).send("Unknown session");
    return;
  }

  await streamableTransports[sessionId].handleRequest(req, res);

  console.log("[MCP] GET completed");
});
app.delete("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as
    | string
    | undefined;

  if (!sessionId || !streamableTransports[sessionId]) {
    res.status(404).send("Unknown session");
    return;
  }

  await streamableTransports[sessionId].handleRequest(req, res);
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime()
  });
});

const port = 3000;

app.listen(port, () => {
  console.log(`MCP Server listening on ${port}`);
});