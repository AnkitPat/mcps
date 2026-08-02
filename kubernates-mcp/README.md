# Kubernetes MCP Server

This server exposes Kubernetes cluster diagnostics (read-only) via the Model Context Protocol (MCP).

## How to use

This server can be connected to any MCP-compliant client (like Claude Desktop).

### Local Configuration

1. **Build the server**:
   ```bash
   npm install
   npm run build
   ```

2. **Configure your MCP Client** (e.g., Claude Desktop):
   Add the following to your `claude_desktop_config.json`:
   ```json
   {
     "mcpServers": {
       "kubernetes": {
         "command": "node",
         "args": ["/path/to/your/kubernates-mcp/dist/index.js"]
       }
     }
   }
   ```

## Authentication

For local development, you can use token-based authentication. Set `AUTH_MODE=token` and `MCP_AUTH_TOKEN` in your environment.

For production, it is recommended to use OIDC bearer tokens.

