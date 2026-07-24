import { z } from "zod";
import { k8sApi } from "../k8sClient.js";

export const getPodLogsTool = {
  name: "get_pod_logs",
  schema: {
    description: "Get the last 10 lines of logs for pods, filtered by name (substring) or namespace",
    inputSchema: z
      .object({
        namespace: z.string().optional().describe("Namespace to filter by"),
        podSearch: z.string().optional().describe("Substring to search in pod names"),
      })
      .refine((data) => data.namespace || data.podSearch, {
        message: "At least one of 'namespace' or 'podSearch' must be provided",
        path: ["namespace", "podSearch"],
      }),
  },
  execute: async ({ namespace, podSearch }: { namespace?: string; podSearch?: string }) => {
    try {
      // 1. Discovery
      const res = namespace
        ? await k8sApi.listNamespacedPod({ namespace })
        : await k8sApi.listPodForAllNamespaces();
      
      let pods = res.items || [];

      // 2. Filter
      if (podSearch) {
        pods = pods.filter(pod => pod.metadata?.name?.includes(podSearch));
      }

      // 3. Safety Limit
      const limitedPods = pods.slice(0, 10);
      
      if (limitedPods.length === 0) {
        return { content: [{ type: "text" as const, text: "No pods found matching criteria." }] };
      }

      // 4. Retrieve Logs
      const results: Record<string, string> = {};
      
      for (const pod of limitedPods) {
        const podName = pod.metadata?.name;
        const podNamespace = pod.metadata?.namespace;
        if (!podName || !podNamespace) continue;

        try {
          // @ts-ignore - Assuming readNamespacedPodLog exists in k8sApi
          const logs = await k8sApi.readNamespacedPodLog({
            name: podName,
            namespace: podNamespace,
            tailLines: 10,
          });
          results[`${podNamespace}/${podName}`] = logs.body as string;
        } catch (e: any) {
          results[`${podNamespace}/${podName}`] = `Error fetching logs: ${e.message}`;
        }
      }

      return {
        content: [{ type: "text" as const, text: JSON.stringify(results, null, 2) }],
      };
    } catch (e: any) {
      console.error("Kubernetes API Error:", e.response?.data || e.message);
      return {
        content: [{ type: "text" as const, text: `Error: ${e.message}` }],
        isError: true,
      };
    }
  },
};

export const countPodsTool = {
  name: "count_pods",
  schema: {
    description: "Get the total number of pods",
    inputSchema: z.object({ namespace: z.string().optional().describe("Namespace to filter by") }),
  },
  execute: async ({ namespace }: { namespace?: string }) => {
    try {
      const res = namespace
        ? await k8sApi.listNamespacedPod({ namespace: namespace })
        : await k8sApi.listPodForAllNamespaces();
      const pods = res.items || [];
      return {
        content: [{ type: "text" as const, text: `Total pods: ${pods.length}` }],
      };
    } catch (e: any) {
      console.error("Kubernetes API Error:", e.response?.data || e.message);
      return {
        content: [{ type: "text" as const, text: `Error: ${e.message}` }],
        isError: true,
      };
    }
  },
};

export const getPodsHealthTool = {
  name: "get_pods_health",
  schema: {
    description: "Get the health status of all pods in a namespace",
    inputSchema: z.object({ namespace: z.string().describe("Namespace to query") }),
  },
  execute: async ({ namespace }: { namespace: string }) => {
    try {
      const res = await k8sApi.listNamespacedPod({ namespace: namespace });
      const pods = res.items || [];
      const health = pods.map((pod) => ({
        name: pod.metadata?.name,
        status: pod.status?.phase,
      }));
      return {
        content: [{ type: "text" as const, text: JSON.stringify(health, null, 2) }],
      };
    } catch (e: any) {
      console.error("Kubernetes API Error:", e.response?.data || e.message);
      return {
        content: [{ type: "text" as const, text: `Error: ${e.message}` }],
        isError: true,
      };
    }
  },
};
