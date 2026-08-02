export async function listDeployments(clients, namespace) {
    const res = namespace
        ? await clients.apps.listNamespacedDeployment({ namespace })
        : await clients.apps.listDeploymentForAllNamespaces();
    const deployments = res.items || [];
    return deployments.map((d) => ({
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
}
