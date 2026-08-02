# Kubernetes MCP to ChatGPT Plugin Adapter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a Node.js/Express adapter that exposes existing Kubernetes MCP tools as a ChatGPT plugin, enabling integration of Kubernetes operations into ChatGPT.

**Architecture:** We will create a `plugin-adapter/` directory with a lightweight Express server that serves `ai-plugin.json` and `openapi.yaml`, and maps HTTP requests to calls against the existing `src/` modules. We will refactor `src/` as necessary to ensure core logic is exported and testable independently.

**Tech Stack:** Node.js, TypeScript, Express.js.

---

### Task 1: Prepare Core Logic for Reuse

**Files:**
- Modify: `src/k8sClient.ts`
- Modify: `src/tools/kubernetesTools.ts`

- [ ] **Step 1: Refactor `src/k8sClient.ts` to export functionality**
  Ensure the client instance creation and methods are exported correctly.
- [ ] **Step 2: Refactor `src/tools/kubernetesTools.ts` to export tool functions**
  Ensure functions like `listDeployments` are exported and don't depend on MCP-specific wrappers.
- [ ] **Step 3: Commit**
```bash
git add src/k8sClient.ts src/tools/kubernetesTools.ts
git commit -m "refactor: export core kubernetes functionality for plugin adapter"
```

### Task 2: Scaffold Plugin Adapter Server

**Files:**
- Create: `plugin-adapter/package.json`
- Create: `plugin-adapter/tsconfig.json`
- Create: `plugin-adapter/src/index.ts`

- [ ] **Step 1: Write `plugin-adapter/package.json`**
```json
{
  "name": "kubernetes-plugin-adapter",
  "version": "1.0.0",
  "main": "dist/index.js",
  "scripts": {
    "start": "tsc && node dist/index.js"
  },
  "dependencies": {
    "express": "^4.18.0",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "@types/express": "^4.17.0",
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
```
- [ ] **Step 2: Write `plugin-adapter/tsconfig.json`**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true
  }
}
```
- [ ] **Step 3: Write `plugin-adapter/src/index.ts` (minimal Express app)**
```typescript
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/.well-known/ai-plugin.json', (req, res) => {
    res.sendFile('ai-plugin.json', { root: __dirname + '/../' });
});

app.get('/openapi.yaml', (req, res) => {
    res.sendFile('openapi.yaml', { root: __dirname + '/../' });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Plugin adapter running on port ${PORT}`));
```
- [ ] **Step 4: Commit**
```bash
git add plugin-adapter/package.json plugin-adapter/tsconfig.json plugin-adapter/src/index.ts
git commit -m "feat: scaffold plugin adapter server"
```

### Task 3: Implement Plugin Manifest and API Spec

**Files:**
- Create: `plugin-adapter/ai-plugin.json`
- Create: `plugin-adapter/openapi.yaml`

- [ ] **Step 1: Write `plugin-adapter/ai-plugin.json`**
```json
{
  "schema_version": "v1",
  "name_for_model": "k8s_plugin",
  "name_for_human": "Kubernetes Plugin",
  "description_for_model": "Plugin for interacting with Kubernetes cluster, listing deployments, etc.",
  "auth": { "type": "none" },
  "api": {
    "type": "openapi",
    "url": "http://localhost:3000/openapi.yaml"
  },
  "logo_url": "http://localhost:3000/logo.png"
}
```
- [ ] **Step 2: Write `plugin-adapter/openapi.yaml` (minimal)**
```yaml
openapi: 3.0.1
info:
  title: Kubernetes Plugin
  version: 1.0.0
servers:
  - url: http://localhost:3000
paths:
  /deployments:
    get:
      summary: List deployments
      operationId: listDeployments
      responses:
        '200':
          description: OK
```
- [ ] **Step 3: Commit**
```bash
git add plugin-adapter/ai-plugin.json plugin-adapter/openapi.yaml
git commit -m "feat: add plugin manifest and openapi spec"
```

### Task 4: Bridge Adapter to Core Logic

**Files:**
- Modify: `plugin-adapter/src/index.ts`

- [ ] **Step 1: Implement endpoint in `plugin-adapter/src/index.ts`**
```typescript
import { listDeployments } from '../../src/tools/kubernetesTools';
// ... existing imports ...

app.get('/deployments', async (req, res) => {
    try {
        const result = await listDeployments();
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: 'Failed to list deployments' });
    }
});
```
- [ ] **Step 2: Test API endpoint**
Run: `cd plugin-adapter && npm install && npm start`
Open: `http://localhost:3000/deployments`
Expected: JSON response from Kubernetes cluster.
- [ ] **Step 3: Commit**
```bash
git add plugin-adapter/src/index.ts
git commit -m "feat: implement deployments endpoint"
```
