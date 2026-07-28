import { z } from "zod";
import { k8sApi } from "../k8sClient.js";
export const getPodLogsTool = {
    name: "get_pod_logs",
    schema: {
        title: "Get Kubernetes Pod Logs",
        description: `
Retrieve the latest logs from Kubernetes pods.

Use this tool whenever the user asks to:

• show logs
• view pod logs
• debug a pod
• investigate CrashLoopBackOff
• inspect application logs
• troubleshoot Kubernetes workloads

Examples:

- Show logs for eurocampings-staging
- Get frontend logs
- Show logs for pods containing "api"
- Debug worker pod
- Show logs from the last 5 minutes (sinceSeconds=300)

Returns up to 50 log lines for up to 10 matching pods.
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
                .describe("Kubernetes namespace to search. Examples: eurocampings-staging, eurocampings-prod, default."),
            podSearch: z
                .string()
                .optional()
                .describe("Optional partial pod name filter. Examples: api, frontend, nginx, worker."),
            sinceSeconds: z
                .number()
                .optional()
                .describe("Relative time in seconds before the current time from which to show logs."),
        })
            .refine((data) => data.namespace || data.podSearch, {
            message: "Provide either namespace or podSearch.",
        }),
    },
    execute: async ({ namespace, podSearch, sinceSeconds, }) => {
        try {
            const res = namespace
                ? await k8sApi.listNamespacedPod({ namespace })
                : await k8sApi.listPodForAllNamespaces();
            let pods = res.items || [];
            if (podSearch) {
                pods = pods.filter((pod) => pod.metadata?.name?.includes(podSearch));
            }
            const limitedPods = pods.slice(0, 10);
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
                    // @ts-ignore
                    const logs = await k8sApi.readNamespacedPodLog({
                        name: podName,
                        namespace: podNamespace,
                        tailLines: 50,
                        sinceSeconds: sinceSeconds,
                    });
                    // @ts-ignore
                    results[`${podNamespace}/${podName}`] =
                        logs;
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
