import * as k8s from '@kubernetes/client-node';

const kc = new k8s.KubeConfig();

// Configure cluster and user manually
const clusterUrl = 'https://acsi-aks-cluster-1-dns-qgn41gtz.hcp.germanywestcentral.azmk8s.io:443';
const token = process.env.K8S_API_TOKEN;

if (!token) {
  throw new Error("K8S_API_TOKEN environment variable is required.");
}

kc.loadFromOptions({
  clusters: [{ name: 'cluster', server: clusterUrl, caData: process.env.K8S_API_CA }],
  users: [{ name: 'user', token: token }],
  contexts: [{ name: 'context', cluster: 'cluster', user: 'user' }],
  currentContext: 'context',
});

export const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
