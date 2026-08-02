import * as k8s from "@kubernetes/client-node";

export interface KubernetesClients {
  core: k8s.CoreV1Api;
  apps: k8s.AppsV1Api;
  custom: k8s.CustomObjectsApi;
}

let clients: KubernetesClients | undefined;

export function getK8sClients() {
  if (clients) {
    return clients;
  }

  const token = process.env.K8S_API_TOKEN;
  const ca = process.env.K8S_API_CA;
  const server = process.env.K8S_API_SERVER;

  if (!token) {
    throw new Error("K8S_API_TOKEN environment variable is required.");
  }
  if (!server) {
    throw new Error("K8S_API_SERVER environment variable is required.");
  }

  const kc = new k8s.KubeConfig();

  kc.loadFromOptions({
    clusters: [
      {
        name: "cluster",
        server,
        caData: ca,
      },
    ],
    users: [{ name: "user", token }],
    contexts: [{ name: "context", cluster: "cluster", user: "user" }],
    currentContext: "context",
  });

  clients = {
    core: kc.makeApiClient(k8s.CoreV1Api),
    apps: kc.makeApiClient(k8s.AppsV1Api),
    custom: kc.makeApiClient(k8s.CustomObjectsApi),
  };

  return clients;
}
