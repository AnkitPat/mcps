import { expect, test, vi } from 'vitest';
import { listDeployments } from './kubernetesCore.js';
import * as k8s from "@kubernetes/client-node";

test('listDeployments calls apps client correctly', async () => {
    const mockApps = {
      listDeploymentForAllNamespaces: vi.fn().mockResolvedValue({
        items: [{ metadata: { name: 'dep1', namespace: 'default' } }]
      })
    } as unknown as k8s.AppsV1Api;
    
    const clients = { apps: mockApps } as any;
    
    const result = await listDeployments(clients);
    
    expect(mockApps.listDeploymentForAllNamespaces).toHaveBeenCalled();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('dep1');
});
