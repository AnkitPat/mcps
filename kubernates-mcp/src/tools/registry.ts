import { 
    kubernetes_list_deployments_tool,
    kubernetes_describe_pod_tool,
    kubernetes_get_pod_logs_tool,
    kubernetes_count_pods_tool,
    kubernetes_get_pods_health_tool,
    kubernetes_get_pod_metrics_tool,
    kubernetes_get_events_tool,
    kubernetes_describe_deployment_tool
} from "./kubernetesTools.js";

export const toolRegistry = [
    kubernetes_list_deployments_tool,
    kubernetes_describe_pod_tool,
    kubernetes_get_pod_logs_tool,
    kubernetes_count_pods_tool,
    kubernetes_get_pods_health_tool,
    kubernetes_get_pod_metrics_tool,
    kubernetes_get_events_tool,
    kubernetes_describe_deployment_tool
];
