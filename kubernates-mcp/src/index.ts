import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { countPodsTool, getPodsHealthTool, getPodLogsTool } from "./tools/kubernetesTools.js";
import express from "express";
import cors from "cors";

const server = new McpServer({
  name: "kubernetes-mcp",
  version: "1.0.0",
});

// Tool registration
server.registerTool(countPodsTool.name, countPodsTool.schema, countPodsTool.execute);
server.registerTool(getPodsHealthTool.name, getPodsHealthTool.schema, getPodsHealthTool.execute);
server.registerTool(getPodLogsTool.name, getPodLogsTool.schema, getPodLogsTool.execute);

const app = express();
app.use(cors());

let transport: SSEServerTransport;

app.get("/sse", async (req, res) => {
  transport = new SSEServerTransport("/messages", res);
  await server.connect(transport);
});

app.post("/messages", async (req, res) => {
  if (!transport) {
    res.status(400).send("Transport not initialized");
    return;
  }
  await transport.handlePostMessage(req, res);
});

app.listen(3000, () => console.log("MCP Server running on port 3000"));
