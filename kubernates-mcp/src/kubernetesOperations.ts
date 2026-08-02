import { getK8sClients } from './k8sClient.js';

export async function listDeployments(namespace?: string) {
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

  return curatedDeployments;
}
