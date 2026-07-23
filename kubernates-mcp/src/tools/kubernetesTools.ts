import { z } from "zod";
import { k8sApi } from "../k8sClient.js";

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
