import { randomUUID } from "node:crypto";
import express, { Request, Response } from "express";
import cors from "cors";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";

const app = express();
app.use(express.json());
app.use(
    cors({
        origin: "*",
        exposedHeaders: ["Mcp-Session-Id"],
    })
);

function createServer(): McpServer {
    const server = new McpServer({
        name: "sample-streamable-mcp",
        version: "1.0.0",
    });

    // 1. Sample Tool
    server.registerTool(
        "add_numbers",
        {
            title: "Add Numbers",
            description: "Add two numbers together",
            inputSchema: {
                a: z.number().describe("First number"),
                b: z.number().describe("Second number"),
            },
        },
        async ({ a, b }) => ({
            content: [{ type: "text", text: String(a + b) }],
        })
    );

    // 1. Sample Tool
    server.registerTool(
        "subtract_numbers",
        {
            title: "Add Numbers",
            description: "Add two numbers together",
            inputSchema: {
                a: z.number().describe("First number"),
                b: z.number().describe("Second number"),
            },
        },
        async ({ a, b }) => ({
            content: [{ type: "text", text: String(a - b) }],
        })
    );

    return server;
}

// Track active transports per session ID
const transports = new Map<string, StreamableHTTPServerTransport>();

// Client -> Server requests (including initialize)
app.post("/mcp", async (req: Request, res: Response) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;

    let transport = sessionId ? transports.get(sessionId) : undefined;

    if (!transport && isInitializeRequest(req.body)) {
        transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => randomUUID(),
            onsessioninitialized: (id) => {
                transports.set(id, transport!);
            },
        });

        transport.onclose = () => {
            if (transport?.sessionId) {
                transports.delete(transport.sessionId);
            }
        };

        const server = createServer();
        await server.connect(transport);
    }

    if (!transport) {
        res.status(400).json({
            jsonrpc: "2.0",
            error: { code: -32000, message: "Bad Request: Missing or invalid session ID" },
            id: null,
        });
        return;
    }

    await transport.handleRequest(req, res, req.body);
});

// Server -> Client SSE stream & session termination
async function handleSessionRequest(req: Request, res: Response) {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    const transport = sessionId ? transports.get(sessionId) : undefined;

    if (!transport) {
        res.status(400).send("Invalid or missing Mcp-Session-Id header");
        return;
    }

    await transport.handleRequest(req, res);
}

app.get("/mcp", handleSessionRequest);
app.delete("/mcp", handleSessionRequest);

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`MCP server running at http://localhost:${PORT}/mcp`);
});