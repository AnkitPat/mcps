# Kubernetes MCP for ChatGPT

This server exposes read-only Kubernetes diagnostics to ChatGPT through the Model Context Protocol (MCP).

## Authentication

Production deployments use OIDC bearer access tokens. Set `OIDC_ISSUER`, `OIDC_AUDIENCE`, and
`MCP_PUBLIC_URL`; the server publishes OAuth protected-resource metadata at
`/.well-known/oauth-protected-resource` and requires the `kubernetes.read` scope on `/mcp`.

The service account behind `K8S_API_TOKEN` must be restricted to the namespaces and read operations
needed by these tools. OIDC identifies the ChatGPT user, but Kubernetes calls still use this service
account; use a separate server deployment per permission boundary.

For local testing only, set `AUTH_MODE=token` and `MCP_AUTH_TOKEN`. Never expose a development
token on a public endpoint.

## Deploy and connect

1. Copy `.env.example` into your deployment platform's secret/configuration settings. Do not commit
   secrets.
2. Deploy the image to a public HTTPS endpoint. The process honors `PORT` and defaults to 8080.
3. Configure your identity provider to issue RS256 access tokens with audience `OIDC_AUDIENCE` and
   scope `kubernetes.read` for the ChatGPT MCP client.
4. In ChatGPT developer mode, add the remote MCP endpoint at
   `https://your-domain.example/mcp`, complete the OIDC connection, then publish it through your
   workspace's Apps/Plugins settings.

ChatGPT requires the app to be enabled or explicitly selected in a chat before it can use the app's
external tools. The server cannot override that user-consent boundary.
