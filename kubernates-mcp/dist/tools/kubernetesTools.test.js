import { expect, test, vi, describe } from 'vitest';
import { k8sApi } from '../k8sClient.js';
vi.mock('../k8sClient.js', () => ({
    k8sApi: {
        listNamespacedPod: vi.fn(),
        listPodForAllNamespaces: vi.fn(),
        readNamespacedPodLog: vi.fn(),
    }
}));
const mockedK8sApi = vi.mocked(k8sApi);
import { getPodLogsTool, getPodMetricsTool } from './kubernetesTools.js';
describe('getPodLogsTool', () => {
    test('should filter pods by name and retrieve logs', async () => {
        mockedK8sApi.listPodForAllNamespaces.mockResolvedValue({
            items: [
                { metadata: { name: 'pod1', namespace: 'default' } },
                { metadata: { name: 'other', namespace: 'default' } },
            ]
        });
        mockedK8sApi.readNamespacedPodLog.mockResolvedValue('log content');
        const result = await getPodLogsTool.execute({ podSearch: 'pod' });
        expect(result.content[0].text).toContain('default/pod1');
        expect(result.content[0].text).not.toContain('other');
        expect(mockedK8sApi.readNamespacedPodLog).toHaveBeenCalledWith(expect.objectContaining({ name: 'pod1' }));
    });
});
describe('getPodMetricsTool', () => {
    test('should return error if env vars are missing', async () => {
        const result = await getPodMetricsTool.execute({ namespace: 'default', podName: 'pod1' });
        expect(result.isError).toBe(true);
    });
});
