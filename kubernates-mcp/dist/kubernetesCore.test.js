import { expect, test, vi } from 'vitest';
import { listDeployments } from './kubernetesCore.js';
test('listDeployments calls apps client correctly', async () => {
    const mockApps = {
        listDeploymentForAllNamespaces: vi.fn().mockResolvedValue({
            items: [{ metadata: { name: 'dep1', namespace: 'default' } }]
        })
    };
    const clients = { apps: mockApps };
    const result = await listDeployments(clients);
    expect(mockApps.listDeploymentForAllNamespaces).toHaveBeenCalled();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('dep1');
});
