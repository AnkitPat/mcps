import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

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

const PORT = 3000;
app.listen(PORT, () => console.log(`Plugin adapter running on port ${PORT}`));
