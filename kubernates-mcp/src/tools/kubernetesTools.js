import { z } from "zod";
import { k8sApi } from "../k8sClient.js";
export const describePodTool = {
    name: "describe_pod",
    schema: {
        title: "Describe Kubernetes Pod",
        description: `
Retrieve full details (spec, status, events, etc.) for a specific Kubernetes pod.
Equivalent to 'kubectl describe pod <name>'.

If the namespace is not provided, the tool will search all namespaces to find the pod.

Use this tool to:
• Inspect pod configuration
• Check pod status/phase
• View container details (images, ports, env)
• Troubleshoot pod scheduling or runtime issues
`,
        annotations: {
            title: "Describe Kubernetes Pod",
            readOnlyHint: true,
            idempotentHint: true,
            openWorldHint: true,
        },
        inputSchema: z.object({
            podName: z
                .string()
                .describe("The name of the pod to describe."),
            namespace: z
                .string()
                .optional()
                .describe("Optional Kubernetes namespace. If omitted, all namespaces will be searched."),
        }),
    },
    execute: async ({ podName, namespace, }) => {
        try {
            let targetNamespace = namespace;
            // 1. Discover namespace if not provided
            if (!targetNamespace) {
                const podsRes = await k8sApi.listPodForAllNamespaces({
                    fieldSelector: `metadata.name=${podName}`,
                });
                const pods = podsRes.items || [];
                if (pods.length === 0) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify({
                                    error: `Pod '${podName}' not found in any namespace.`,
                                }),
                            },
                        ],
                    };
                }
                if (pods.length > 1) {
                    const foundNamespaces = pods.map(p => p.metadata?.namespace).join(", ");
                    return {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify({
                                    error: `Multiple pods found with name '${podName}' in namespaces: ${foundNamespaces}. Please specify a namespace.`,
                                }),
                            },
                        ],
                    };
                }
                targetNamespace = pods[0].metadata?.namespace;
            }
            if (!targetNamespace) {
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                error: `Could not determine namespace for pod '${podName}'.`,
                            }),
                        },
                    ],
                };
            }
            // 2. Retrieve pod details
            const podRes = await k8sApi.readNamespacedPod({
                name: podName,
                namespace: targetNamespace,
            });
            console.log(podRes);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(podRes),
                    },
                ],
            };
        }
        catch (e) {
            return {
                isError: true,
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            error: e.message,
                        }),
                    },
                ],
            };
        }
    },
};
export const getPodLogsTool = {
    name: "get_pod_logs",
    schema: {
        title: "Get Kubernetes Pod Logs",
        description: `
Retrieve and filter logs from Kubernetes pods.

Use this tool for:
• Debugging application errors
• Troubleshooting specific incidents (e.g., 10am-11am)
• Finding specific keywords in logs (e.g., "timeout", "error")
• Checking logs from a specific point in time

Features:
- Time-based: Use 'sinceSeconds' (relative) or 'sinceTime' (absolute ISO string).
- Search: Use 'grep' to filter for specific keywords or regex patterns.
- Context: Use 'grepContext' to see lines before/after a 'grep' match.

Examples:
- Show logs for eurocampings-staging since 10:00 (sinceTime="2024-03-25T10:00:00Z")
- Find "ConnectionTimeout" in frontend logs with 10 lines of context (grep="ConnectionTimeout", grepContext=10)
- Get last 1 hour of api logs (sinceSeconds=3600)
`,
        annotations: {
            title: "Get Kubernetes Pod Logs",
            readOnlyHint: true,
            idempotentHint: true,
            openWorldHint: true,
        },
        inputSchema: z
            .object({
            namespace: z
                .string()
                .optional()
                .describe("Kubernetes namespace. Examples: eurocampings-staging, eurocampings-prod, default."),
            podSearch: z
                .string()
                .optional()
                .describe("Optional partial pod name filter. Examples: api, frontend, worker."),
            sinceSeconds: z
                .number()
                .optional()
                .describe("Relative time in seconds before the current time from which to show logs."),
            sinceTime: z
                .string()
                .optional()
                .describe("Absolute ISO 8601 timestamp from which to show logs (e.g., '2024-03-25T10:00:00Z')."),
            tailLines: z
                .number()
                .optional()
                .describe("Number of lines to return from the end of the logs. Default 50, max 1000."),
            grep: z
                .string()
                .optional()
                .describe("Optional search string or regex to filter log lines. Only lines matching this (and context) will be returned."),
            grepContext: z
                .number()
                .optional()
                .describe("Number of lines of context to show around each 'grep' match. Default 0."),
        })
            .refine((data) => data.namespace || data.podSearch, {
            message: "Provide either namespace or podSearch.",
        }),
    },
    execute: async ({ namespace, podSearch, sinceSeconds, sinceTime, tailLines = 50, grep, grepContext = 0, }) => {
        try {
            const res = namespace
                ? await k8sApi.listNamespacedPod({ namespace })
                : await k8sApi.listPodForAllNamespaces();
            let pods = res.items || [];
            if (podSearch) {
                pods = pods.filter((pod) => pod.metadata?.name?.includes(podSearch));
            }
            const limitedPods = pods.slice(0, 5); // Limit to 5 pods when doing heavy logging
            if (limitedPods.length === 0) {
                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                message: "No matching pods found.",
                            }),
                        },
                    ],
                };
            }
            const results = {};
            for (const pod of limitedPods) {
                const podName = pod.metadata?.name;
                const podNamespace = pod.metadata?.namespace;
                if (!podName || !podNamespace)
                    continue;
                try {
                    const fetchOptions = {
                        name: podName,
                        namespace: podNamespace,
                        tailLines: Math.min(tailLines, 1000),
                    };
                    if (sinceSeconds)
                        fetchOptions.sinceSeconds = sinceSeconds;
                    if (sinceTime)
                        fetchOptions.sinceTime = sinceTime;
                    // @ts-ignore
                    const response = await k8sApi.readNamespacedPodLog(fetchOptions);
                    // @ts-ignore
                    let logs = response;
                    if (grep) {
                        const lines = logs.split("\n");
                        const grepRegex = new RegExp(grep, "i");
                        const filteredLines = [];
                        const matchedIndices = [];
                        // Find match indices
                        lines.forEach((line, index) => {
                            if (grepRegex.test(line)) {
                                matchedIndices.push(index);
                            }
                        });
                        if (matchedIndices.length === 0) {
                            results[`${podNamespace}/${podName}`] = `--- No matches found for grep: "${grep}" ---`;
                            continue;
                        }
                        // Extract context
                        const linesToInclude = new Set();
                        matchedIndices.forEach((matchIdx) => {
                            const start = Math.max(0, matchIdx - grepContext);
                            const end = Math.min(lines.length - 1, matchIdx + grepContext);
                            for (let i = start; i <= end; i++) {
                                linesToInclude.add(i);
                            }
                        });
                        const sortedIndices = Array.from(linesToInclude).sort((a, b) => a - b);
                        let lastIdx = -1;
                        sortedIndices.forEach((idx) => {
                            if (lastIdx !== -1 && idx > lastIdx + 1) {
                                filteredLines.push("... [...] ...");
                            }
                            filteredLines.push(lines[idx]);
                            lastIdx = idx;
                        });
                        logs = filteredLines.join("\n");
                    }
                    results[`${podNamespace}/${podName}`] = logs;
                }
                catch (e) {
                    results[`${podNamespace}/${podName}`] = `Error fetching logs: ${e.message}`;
                }
            }
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(results),
                    },
                ],
            };
        }
        catch (e) {
            return {
                isError: true,
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            error: e.message,
                        }),
                    },
                ],
            };
        }
    },
};
export const countPodsTool = {
    name: "count_pods",
    schema: {
        title: "Count Kubernetes Pods",
        description: `
Return the CURRENT number of Kubernetes pods.

This tool MUST be used whenever the user asks:

• how many pods
• pod count
• number of pods
• total pods
• count pods
• pods in a namespace
• workload size

Never estimate the answer.
Always query the Kubernetes cluster.

Examples:

User:
How many pods are running?

Tool:
count_pods()

---

User:
Tell me the number of pods in eurocampings-staging.

Tool:
count_pods({
  namespace: "eurocampings-staging"
})

---

User:
Pod count for production.

Tool:
count_pods({
  namespace: "production"
})
`,
        annotations: {
            title: "Count Kubernetes Pods",
            readOnlyHint: true,
            idempotentHint: true,
            openWorldHint: true,
        },
        inputSchema: z.object({
            namespace: z
                .string()
                .optional()
                .describe("Optional Kubernetes namespace. Examples: eurocampings-staging, eurocampings-prod, default. If omitted, all namespaces are counted."),
        }),
    },
    execute: async ({ namespace, }) => {
        try {
            const res = namespace
                ? await k8sApi.listNamespacedPod({
                    namespace,
                })
                : await k8sApi.listPodForAllNamespaces();
            const pods = res.items || [];
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            namespace: namespace ?? "all",
                            totalPods: pods.length,
                        }),
                    },
                ],
            };
        }
        catch (e) {
            return {
                isError: true,
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            error: e.message,
                        }),
                    },
                ],
            };
        }
    },
};
export const getPodsHealthTool = {
    name: "get_pods_health",
    schema: {
        title: "Get Kubernetes Pod Health",
        description: `
Retrieve the runtime health of Kubernetes pods.

Use this tool ONLY when the user asks about:

• pod health
• pod status
• running pods
• failed pods
• pending pods
• CrashLoopBackOff
• unhealthy pods
• readiness
• liveness

DO NOT use this tool for counting pods.

If the user asks:

- How many pods?
- Pod count?
- Number of pods?

Use the "count_pods" tool instead.

Examples:

- Check pod health
- Are any pods unhealthy?
- Show failed pods
- Which pods are Pending?
- Are all pods Running?
`,
        annotations: {
            title: "Get Kubernetes Pod Health",
            readOnlyHint: true,
            idempotentHint: true,
            openWorldHint: true,
        },
        inputSchema: z.object({
            namespace: z
                .string()
                .describe("Kubernetes namespace to inspect. Examples: eurocampings-staging, eurocampings-prod."),
        }),
    },
    execute: async ({ namespace, }) => {
        try {
            const res = await k8sApi.listNamespacedPod({
                namespace,
            });
            const pods = res.items || [];
            const health = pods.map((pod) => ({
                name: pod.metadata?.name,
                status: pod.status?.phase,
            }));
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(health),
                    },
                ],
            };
        }
        catch (e) {
            return {
                isError: true,
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            error: e.message,
                        }),
                    },
                ],
            };
        }
    },
};
export const getPodMetricsTool = {
    name: "get_pod_metrics",
    schema: {
        description: "Get CPU/Memory metrics for a specific pod",
        inputSchema: z.object({
            namespace: z.string().describe("The namespace of the pod"),
            podName: z.string().describe("The name of the pod"),
        }),
    },
    execute: async ({ namespace, podName }) => {
        const apiUrl = process.env.DASHBOARD_API_URL;
        const apiToken = process.env.DASHBOARD_API_TOKEN;
        if (!apiUrl || !apiToken) {
            return {
                content: [{ type: "text", text: "Missing DASHBOARD_API_URL or DASHBOARD_API_TOKEN environment variables." }],
                isError: true,
            };
        }
        try {
            const response = await fetch(`${apiUrl}/api/v1/pod/${namespace}/${podName}`, {
                headers: {
                    'Authorization': `Bearer ${apiToken}`,
                    'Accept': 'application/json'
                }
            });
            if (!response.ok) {
                return {
                    content: [{ type: "text", text: `API Request failed with status: ${response.status}` }],
                    isError: true,
                };
            }
            const data = await response.json();
            return {
                content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
            };
        }
        catch (e) {
            return {
                content: [{ type: "text", text: `Error fetching metrics: ${e.message}` }],
                isError: true,
            };
        }
    },
};
