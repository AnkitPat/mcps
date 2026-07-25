import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { countPodsTool, getPodsHealthTool, getPodLogsTool } from "./tools/kubernetesTools.js";
import express from "express";
import cors from "cors";
import crypto from "crypto";
const server = new McpServer({ name: "kubernetes-mcp", version: "1.0.0" });
// Tool registration
server.registerTool(countPodsTool.name, countPodsTool.schema, countPodsTool.execute);
server.registerTool(getPodsHealthTool.name, getPodsHealthTool.schema, getPodsHealthTool.execute);
server.registerTool(getPodLogsTool.name, getPodLogsTool.schema, getPodLogsTool.execute);
const app = express();
app.use(cors());
const transportMap = new Map();
app.get("/sse", async (req, res) => {
    const sessionId = crypto.randomUUID();
    const transport = new SSEServerTransport(`/messages/${sessionId}`, res);
    transportMap.set(sessionId, transport);
    await server.connect(transport);
    req.on("close", () => {
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
    }
    catch (error) {
        console.error("Message handling error:", error);
        res.status(500).send("Internal server error");
    }
});
app.listen(3000, () => console.log("MCP Server running on port 3000"));
