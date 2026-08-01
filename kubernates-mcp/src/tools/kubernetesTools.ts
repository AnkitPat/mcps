import { z } from "zod";
import { getK8sClients } from "../k8sClient.js";

export async function listDeployments({ namespace }: { namespace?: string }) {
  try {
    const { apps } = getK8sClients();

    const res = namespace
      ? await apps.listNamespacedDeployment({ namespace })
      : await apps.listDeploymentForAllNamespaces();

    const deployments = res.items || [];

    const curatedDeployments = deployments.map((d) => ({
      name: d.metadata?.name,
      namespace: d.metadata?.namespace,
      status: {
        availableReplicas: d.status?.availableReplicas ?? 0,
        desiredReplicas: d.spec?.replicas ?? 0,
        readyReplicas: d.status?.readyReplicas ?? 0,
      },
      containers: d.spec?.template.spec?.containers.map((c) => ({
        name: c.name,
        image: c.image,
      })) ?? [],
      labels: d.spec?.selector?.matchLabels ?? {},
    }));

    return {
      content: [{ type: "text" as const, text: JSON.stringify(curatedDeployments, null, 2) }],
    };
  } catch (e: any) {
    return {
      isError: true,
      content: [{ type: "text" as const, text: `Error fetching deployments: ${e.message}` }],
    };
  }
}

export const kubernetes_list_deployments_tool = {
  name: "kubernetes_list_deployments",
  schema: {
    title: "List Kubernetes Deployments",
    description: `
Returns a list of Kubernetes deployments with status, images, and labels.

Input:
- namespace: Kubernetes namespace (optional).

Output:
A JSON-formatted list of deployments including:
- Name
- Namespace
- Replica counts (desired/ready/available)
- Container list
- Selector labels

Examples:
- List all deployments: kubernetes_list_deployments()
- List deployments in staging: kubernetes_list_deployments({ namespace: "eurocampings-staging" })
`,
    annotations: {
      title: "List Kubernetes Deployments",
      readOnlyHint: true,
      idempotentHint: true,
      openWorldHint: true,
    },
    inputSchema: z.object({
      namespace: z
        .string()
        .optional()
        .describe("Kubernetes namespace. If omitted, lists all namespaces."),
    }),
  },
  execute: listDeployments,
};

export async function describePod({
    podName,
    namespace,
  }: {
    podName: string;
    namespace?: string;
  }) {
    try {
      const { core } = getK8sClients();

      let targetNamespace = namespace;

      // 1. Discover namespace if not provided
      if (!targetNamespace) {
        const podsRes = await core.listPodForAllNamespaces({
          fieldSelector: `metadata.name=${podName}`,
        });

        const pods = podsRes.items || [];
        if (pods.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
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
                type: "text" as const,
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
              type: "text" as const,
              text: JSON.stringify({
                error: `Could not determine namespace for pod '${podName}'.`,
              }),
            },
          ],
        };
      }

      // 2. Retrieve pod details
      const podRes = await core.readNamespacedPod({
        name: podName,
        namespace: targetNamespace,
      });

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(podRes),
          },
        ],
      };
    } catch (e: any) {
      return {
        isError: true,
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              error: e.message,
            }),
          },
        ],
      };
    }
  }

export const kubernetes_describe_pod_tool = {
  name: "kubernetes_describe_pod",

  schema: {
    title: "Describe Kubernetes Pod",

    description: `
Retrieves full details for a specific Kubernetes pod.

Input:
- podName: The name of the pod to describe.
- namespace: Kubernetes namespace (optional).

Output:
Detailed JSON object containing pod spec, status, events, etc.

Examples:
- Describe pod "web-server": kubernetes_describe_pod({ podName: "web-server" })
- Describe pod in specific namespace: kubernetes_describe_pod({ podName: "web-server", namespace: "prod" })
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
        .describe(
          "Optional Kubernetes namespace. If omitted, all namespaces will be searched."
        ),
    }),
  },

  execute: describePod,
};

export async function getPodLogs({
    namespace,
    podSearch,
    sinceSeconds,
    sinceTime,
    tailLines = 50,
    grep,
    grepContext = 0,
  }: {
    namespace?: string;
    podSearch?: string;
    sinceSeconds?: number;
    sinceTime?: string;
    tailLines?: number;
    grep?: string;
    grepContext?: number;
  }) {
    try {
      const {core} = getK8sClients();
            const res = namespace
        ? await core.listNamespacedPod({ namespace })
        : await core.listPodForAllNamespaces();

      let pods = res.items || [];

      if (podSearch) {
        pods = pods.filter((pod) =>
          pod.metadata?.name?.includes(podSearch)
        );
      }

      const limitedPods = pods.slice(0, 5); // Limit to 5 pods when doing heavy logging

      if (limitedPods.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                message: "No matching pods found.",
              }),
            },
          ],
        };
      }

      const results: Record<string, string> = {};

      for (const pod of limitedPods) {
        const podName = pod.metadata?.name;
        const podNamespace = pod.metadata?.namespace;

        if (!podName || !podNamespace) continue;

        try {
          const fetchOptions: any = {
            name: podName,
            namespace: podNamespace,
            tailLines: Math.min(tailLines, 1000),
          };

          if (sinceSeconds) fetchOptions.sinceSeconds = sinceSeconds;
          if (sinceTime) fetchOptions.sinceTime = sinceTime;

          // @ts-ignore
          const response = await core.readNamespacedPodLog(fetchOptions);
          // @ts-ignore
          let logs = response as string;

          if (grep) {
            const lines = logs.split("\n");
            const grepRegex = new RegExp(grep, "i");
            const filteredLines: string[] = [];
            const matchedIndices: number[] = [];

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
            const linesToInclude = new Set<number>();
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
        } catch (e: any) {
          results[
            `${podNamespace}/${podName}`
          ] = `Error fetching logs: ${e.message}`;
        }
      }

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(results),
          },
        ],
      };
    } catch (e: any) {
      return {
        isError: true,
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              error: e.message,
            }),
          },
        ],
      };
    }
  }

export const kubernetes_get_pod_logs_tool = {
  name: "kubernetes_get_pod_logs",

  schema: {
    title: "Get Kubernetes Pod Logs",

    description: `
Retrieves logs from Kubernetes pods with optional filtering.

Input:
- namespace: Kubernetes namespace (optional).
- podSearch: Partial pod name filter (optional).
- sinceSeconds: Relative time in seconds (optional).
- sinceTime: Absolute ISO 8601 timestamp (optional).
- tailLines: Number of lines to return (optional).
- grep: Search string/regex to filter log lines (optional).
- grepContext: Number of context lines around matches (optional).

Output:
Logs from matching pods.

Examples:
- Logs for eurocampings-staging since 10:00: kubernetes_get_pod_logs({ namespace: "eurocampings-staging", sinceTime: "2024-03-25T10:00:00Z" })
- Find "ConnectionTimeout" in frontend logs: kubernetes_get_pod_logs({ podSearch: "frontend", grep: "ConnectionTimeout", grepContext: 10 })
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
          .describe(
            "Kubernetes namespace. Examples: eurocampings-staging, eurocampings-prod, default."
          ),

        podSearch: z
          .string()
          .optional()
          .describe(
            "Optional partial pod name filter. Examples: api, frontend, worker."
          ),

        sinceSeconds: z
          .number()
          .optional()
          .describe(
            "Relative time in seconds before the current time from which to show logs."
          ),

        sinceTime: z
          .string()
          .optional()
          .describe(
            "Absolute ISO 8601 timestamp from which to show logs (e.g., '2024-03-25T10:00:00Z')."
          ),

        tailLines: z
          .number()
          .optional()
          .describe(
            "Number of lines to return from the end of the logs. Default 50, max 1000."
          ),

        grep: z
          .string()
          .optional()
          .describe(
            "Optional search string or regex to filter log lines. Only lines matching this (and context) will be returned."
          ),

        grepContext: z
          .number()
          .optional()
          .describe(
            "Number of lines of context to show around each 'grep' match. Default 0."
          ),
      })
      .refine((data) => data.namespace || data.podSearch, {
        message: "Provide either namespace or podSearch.",
      }),
  },

  execute: getPodLogs,
};

export async function countPods({
    namespace,
  }: {
    namespace?: string;
  }) {
    try {
      const {core} = getK8sClients();
      const res = namespace
        ? await core.listNamespacedPod({
          namespace,
        })
        : await core.listPodForAllNamespaces();

      const pods = res.items || [];

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              namespace: namespace ?? "all",
              totalPods: pods.length,
            }),
          },
        ],
      };
    } catch (e: any) {
      return {
        isError: true,
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              error: e.message,
            }),
          },
        ],
      };
    }
  }

export const kubernetes_count_pods_tool = {
  name: "kubernetes_count_pods",

  schema: {
    title: "Count Kubernetes Pods",

    description: `
Returns the current number of Pods in a Kubernetes namespace or across the cluster.

Input:
- namespace: Optional Kubernetes namespace. If omitted, all namespaces are counted.

Output:
The total count of pods matching the criteria.
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
        .describe(
          "Optional Kubernetes namespace. If omitted, all namespaces are counted."
        ),
    }),
  },

  execute: countPods,
};

export async function getPodsHealth({
    namespace,
  }: {
    namespace: string;
  }) {
    try {
      const {core} = getK8sClients();

      const res =
        await core.listNamespacedPod({
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
            type: "text" as const,
            text: JSON.stringify(health),
          },
        ],
      };
    } catch (e: any) {
      return {
        isError: true,
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              error: e.message,
            }),
          },
        ],
      };
    }
  }

export const kubernetes_get_pods_health_tool = {
  name: "kubernetes_get_pods_health",

  schema: {
    title: "Get Kubernetes Pod Health",

    description: `
Returns the runtime health (phase) of Kubernetes pods in a namespace.

Input:
- namespace: Kubernetes namespace to inspect.

Output:
A list of pods with their name and phase (e.g., Running, Pending, Failed).
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
        .describe(
          "Kubernetes namespace to inspect."
        ),
    }),
  },

  execute: getPodsHealth,
};

export async function getPodMetrics({ namespace, podName }: { namespace: string; podName: string }) {
    const apiUrl = process.env.DASHBOARD_API_URL;
    const apiToken = process.env.K8S_API_TOKEN;

    if (!apiUrl || !apiToken) {
      return {
        content: [{ type: "text" as const, text: "Missing DASHBOARD_API_URL or DASHBOARD_API_TOKEN environment variables." }],
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
          content: [{ type: "text" as const, text: `API Request failed with status: ${response.status}` }],
          isError: true,
        };
      }

      const data = await response.json();
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    } catch (e: any) {
      return {
        content: [{ type: "text" as const, text: `Error fetching metrics: ${e.message}` }],
        isError: true,
      };
    }
  }

export const kubernetes_get_pod_metrics_tool = {
  name: "kubernetes_get_pod_metrics",
  schema: {
    description: "Get CPU/Memory metrics for a specific pod",
    inputSchema: z.object({
      namespace: z.string().describe("The namespace of the pod"),
      podName: z.string().describe("The name of the pod"),
    }),
  },
  execute: getPodMetrics,
};