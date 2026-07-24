import { expect, test, vi, describe } from 'vitest';
const mockK8sApi = {
    listNamespacedPod: vi.fn(),
    listPodForAllNamespaces: vi.fn(),
    readNamespacedPodLog: vi.fn(),
};
vi.mock('../k8sClient.js', () => ({
    k8sApi: mockK8sApi
}));
import { getPodLogsTool } from './kubernetesTools.js';
describe('getPodLogsTool', () => {
    test('should filter pods by name and retrieve logs', async () => {
        mockK8sApi.listPodForAllNamespaces.mockResolvedValue({
            items: [
                { metadata: { name: 'pod1', namespace: 'default' } },
                { metadata: { name: 'other', namespace: 'default' } },
            ]
        });
        mockK8sApi.readNamespacedPodLog.mockResolvedValue({ body: 'log content' });
        const result = await getPodLogsTool.execute({ podSearch: 'pod' });
        expect(result.content[0].text).toContain('default/pod1');
        expect(result.content[0].text).not.toContain('other');
        expect(mockK8sApi.readNamespacedPodLog).toHaveBeenCalledWith(expect.objectContaining({ name: 'pod1' }));
    });
});
