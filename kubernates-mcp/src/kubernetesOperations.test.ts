import { expect, test, vi, describe } from 'vitest';
import { getK8sClients } from './k8sClient.js';
import { listDeployments } from './kubernetesOperations.js';

const mockApps = {
  listNamespacedDeployment: vi.fn(),
  listDeploymentForAllNamespaces: vi.fn(),
};

vi.mock('./k8sClient.js', () => ({
  getK8sClients: vi.fn(() => ({
    apps: mockApps,
    core: {},
    custom: {},
  })),
}));

describe('kubernetesOperations', () => {
  test('listDeployments should return deployments', async () => {
    mockApps.listDeploymentForAllNamespaces.mockResolvedValue({
      items: [
        {
          metadata: { name: 'dep1', namespace: 'default' },
          spec: { 
            replicas: 3, 
            selector: { matchLabels: { app: 'test' } },
            template: { spec: { containers: [{ name: 'c1', image: 'i1' }] } } 
          },
          status: { availableReplicas: 2, readyReplicas: 3 }
        }
      ]
    });

    const deployments = await listDeployments();
    expect(deployments).toHaveLength(1);
    expect(deployments[0].name).toBe('dep1');
  });
});
