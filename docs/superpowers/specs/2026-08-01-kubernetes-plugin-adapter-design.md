# Design: Kubernetes MCP to ChatGPT Plugin Adapter

## Overview
This design outlines the creation of an adapter to expose existing Kubernetes MCP tools as a ChatGPT Plugin. This allows for seamless integration of Kubernetes operations into ChatGPT workflows while maintaining the core logic within the current TypeScript codebase.

## Architecture
We will create a new directory `plugin-adapter` containing an Express.js server. This server will act as an interface layer between ChatGPT's plugin protocol and the existing Kubernetes logic.

### Components
1. **Existing Core (`/src`):**
   - Retains current `k8sClient.ts` and `kubernetesTools.ts`.
   - Code will be refactored to allow exporting of core logic for reuse by the adapter.
2. **Adapter Server (`/plugin-adapter`):**
   - A lightweight Node.js/Express server.
   - Defines API routes mapping to the existing MCP tool functions.
   - Serves the required `/.well-known/ai-plugin.json`.
   - Serves the `openapi.yaml` specification.

## Data Flow
1. ChatGPT queries the plugin using the defined OpenAPI spec.
2. Adapter receives the HTTP request.
3. Adapter calls the corresponding logic in `src/`.
4. Adapter maps the response back to a JSON format understood by ChatGPT.

## Implementation Plan
1. Refactor `src/` to ensure core logic is independently importable.
2. Scaffolding `plugin-adapter/` with Express.
3. Implementing endpoints for tool discovery and execution.
4. Writing `ai-plugin.json` and `openapi.yaml`.
5. Testing with ChatGPT's plugin validator.

## Testing
- Unit tests for API endpoints.
- Integration tests simulating ChatGPT's calls to the plugin server.
