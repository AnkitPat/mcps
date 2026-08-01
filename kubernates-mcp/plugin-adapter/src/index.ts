import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { listDeployments } from '../../src/tools/kubernetesTools.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

app.get('/.well-known/ai-plugin.json', (req, res) => {
    res.sendFile(path.join(__dirname, '../ai-plugin.json'));
});

app.get('/openapi.yaml', (req, res) => {
    res.sendFile(path.join(__dirname, '../openapi.yaml'));
});

app.get('/deployments', async (req, res) => {
    try {
        const result = await listDeployments({});
        res.json(result);
    } catch (e: any) {
        res.status(500).json({ error: e.message || 'Failed to list deployments' });
    }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Plugin adapter running on port ${PORT}`));
