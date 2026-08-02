import { kubernetes_count_pods_tool, kubernetes_get_pods_health_tool, kubernetes_get_pod_logs_tool, kubernetes_describe_pod_tool, kubernetes_get_pod_metrics_tool, kubernetes_list_deployments_tool } from "./kubernetesTools.js";
// Centralized registry for automatic registration and observability
export const toolRegistry = [
    kubernetes_count_pods_tool,
    kubernetes_get_pods_health_tool,
    kubernetes_get_pod_logs_tool,
    kubernetes_describe_pod_tool,
    kubernetes_get_pod_metrics_tool,
    kubernetes_list_deployments_tool,
];
