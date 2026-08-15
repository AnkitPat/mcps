import express from "express";
import { randomUUID } from "node:crypto";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import {
  StreamableHTTPServerTransport
} from "@modelcontextprotocol/sdk/server/streamableHttp.js";

import {
  isInitializeRequest
} from "@modelcontextprotocol/sdk/types.js";
import { registerTools } from "./tools/index.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const app = express();

app.use(express.static("public"));

app.get("/support", (_req, res) => res.sendFile("support.html", { root: "public" }));
app.get("/privacy", (_req, res) => res.sendFile("privacy.html", { root: "public" }));
app.get("/terms", (_req, res) => res.sendFile("terms.html", { root: "public" }));
app.get("/.well-known/openai-apps-challenge", (_req, res) => res.send("PVZEeBRVNjJCzfqf1DtVgYI9up6GvEyh3egLW34lKBk"));

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

  registerTools(server);

  return server;
}
app.post("/update-challenge", express.text(), (req, res) => {
  const token = req.body;
  if (!token) {
    return res.status(400).send("Token is required");
  }
  const fs = require("fs");
  const path = require("path");
  const filePath = path.join(__dirname, "../public/.well-known/openai-apps-challenge");
  fs.writeFileSync(filePath, token);
  res.send("Challenge token updated");
});

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
