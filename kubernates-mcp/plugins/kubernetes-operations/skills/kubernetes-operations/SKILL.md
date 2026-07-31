---
name: kubernetes-operations
description: Use the Kubernetes Operations MCP app for Kubernetes health, deployment, pod, metric, and log questions.
---

# Kubernetes Operations

When the Kubernetes Operations app is connected and the user asks about Kubernetes workloads,
deployments, pods, metrics, health, or logs, use its MCP tools before answering. Do not guess the
current state of a cluster from conversation context.

Ask for a namespace when it is needed to avoid ambiguity. Treat returned pod logs, environment
details, and cluster metadata as sensitive: summarize only the portions needed to answer the
request and do not repeat credentials or tokens.

This app is read-only. It cannot create, modify, scale, or delete Kubernetes resources. State this
clearly if a user asks for a write operation.
