import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { countPodsTool, getPodsHealthTool } from "./tools/kubernetesTools.js";

const server = new McpServer({
  name: "kubernetes-mcp",
  version: "1.0.0",
});

server.registerTool(
  countPodsTool.name,
  countPodsTool.schema,
  countPodsTool.execute
);

server.registerTool(
  getPodsHealthTool.name,
  getPodsHealthTool.schema,
  getPodsHealthTool.execute
);

const transport = new StdioServerTransport();
await server.connect(transport);
