---
name: kubernetes-operations
description: Use for Kubernetes health checks, listing deployments, pod metrics, and pod logs.
---

# Kubernetes Operations

When the user asks about Kubernetes workloads, deployments, pods, metrics, health, or logs, use the connected MCP tools.

### When to trigger:
- **Health Checks:** Trigger `kubernetes_get_pods_health` to report overall status.
- **Listing Deployments:** Trigger `kubernetes_list_deployments` to show deployment status and replicas.
- **Pod Details:** Trigger `kubernetes_describe_pod` or `kubernetes_count_pods` for specific workload inquiries.
- **Metrics:** Trigger `kubernetes_get_pod_metrics` for resource usage data.
- **Logs:** Trigger `kubernetes_get_pod_logs` to fetch diagnostic data.

### Guidelines:
1. **Namespace:** Always ask for a namespace if it is missing and required by the tool.
2. **Read-only:** This app is read-only. It cannot create, modify, or delete Kubernetes resources. Inform the user if a requested operation is unsupported.
3. **Sensitive Data:** Summarize results appropriately; do not expose credentials, tokens, or raw secrets found in logs.
4. **Tool Selection:** Map user questions directly to the available tool (`kubernetes_count_pods`, `kubernetes_get_pods_health`, `kubernetes_get_pod_logs`, `kubernetes_describe_pod`, `kubernetes_get_pod_metrics`, `kubernetes_list_deployments`).
