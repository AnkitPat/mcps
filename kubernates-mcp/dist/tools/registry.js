import { countPodsTool, getPodsHealthTool, getPodLogsTool, describePodTool, getPodMetricsTool, listDeploymentsTool } from "./kubernetesTools.js";
// Centralized registry for automatic registration and observability
export const toolRegistry = [
    countPodsTool,
    getPodsHealthTool,
    getPodLogsTool,
    describePodTool,
    getPodMetricsTool,
    listDeploymentsTool,
];
