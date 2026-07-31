# Kubernetes Operations plugin

The plugin contains routing guidance that makes connected Kubernetes requests use the MCP app.

Before publishing, replace the empty `mcpServers` object in `.mcp.json` with the final public HTTPS
MCP endpoint and configure the matching OIDC connection in ChatGPT. The endpoint cannot be filled
in safely until the deployment domain and identity provider are known.
