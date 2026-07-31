import { expect, test, vi, describe } from 'vitest';
import { getK8sClients } from '../k8sClient.js';
const mockedGetK8sClients = vi.mocked(getK8sClients);
const mockCore = {
    listNamespacedPod: vi.fn(),
    listPodForAllNamespaces: vi.fn(),
    readNamespacedPodLog: vi.fn(),
    readNamespacedPod: vi.fn(),
};
const mockApps = {
    listNamespacedDeployment: vi.fn(),
    listDeploymentForAllNamespaces: vi.fn(),
};
const mockCustom = {
    listNamespacedCustomObject: vi.fn(),
};
vi.mock('../k8sClient.js', () => ({
    getK8sClients: vi.fn(() => ({
        core: mockCore,
        apps: mockApps,
        custom: mockCustom,
    })),
}));
import * as tools from './kubernetesTools.js';
const { getPodLogsTool, getPodMetricsTool, listDeploymentsTool } = tools;
describe('listDeploymentsTool', () => {
    test('should list deployments', async () => {
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
        const result = await listDeploymentsTool.execute({});
        const deployments = JSON.parse(result.content[0].text);
        expect(deployments).toHaveLength(1);
        expect(deployments[0].name).toBe('dep1');
    });
});
describe('getPodLogsTool', () => {
    test('should filter pods by name and retrieve logs', async () => {
        mockCore.listPodForAllNamespaces.mockResolvedValue({
            items: [
                { metadata: { name: 'pod1', namespace: 'default' } },
                { metadata: { name: 'other', namespace: 'default' } },
            ]
        });
        mockCore.readNamespacedPodLog.mockResolvedValue('log content');
        const result = await getPodLogsTool.execute({ podSearch: 'pod' });
        expect(result.content[0].text).toContain('default/pod1');
        expect(result.content[0].text).not.toContain('other');
        expect(mockCore.readNamespacedPodLog).toHaveBeenCalledWith(expect.objectContaining({ name: 'pod1' }));
    });
});
describe('getPodMetricsTool', () => {
    test('should return error if env vars are missing', async () => {
        const result = await getPodMetricsTool.execute({ namespace: 'default', podName: 'pod1' });
        expect(result.isError).toBe(true);
    });
});
