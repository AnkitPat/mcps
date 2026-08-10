import express from 'express';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { initProvider } from './provider.js';
import { loadUsers, findUserByEmail, verifyPassword } from './users.js';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();
await loadUsers();
const app = express();
app.use(helmet());
app.use(express.urlencoded({ extended: true }));
const issuer = process.env.ISSUER || 'http://localhost:4000';
const provider = await initProvider(issuer);
// Interaction routes
app.get('/interaction/:uid', async (req, res, next) => {
    try {
        const details = await provider.interactionDetails(req, res);
        res.sendFile(path.join(__dirname, 'views', 'login.html'));
    }
    catch (err) {
        next(err);
    }
});
app.post('/interaction/:uid', async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = findUserByEmail(email);
        if (user && await verifyPassword(user, password)) {
            const result = { login: { accountId: user.email } }; // Using email as accountId
            await provider.interactionFinished(req, res, result, { mergeWithLastSubmission: false });
        }
        else {
            res.status(401).send('Invalid email or password');
        }
    }
    catch (err) {
        next(err);
    }
});
// Mount the OIDC provider
app.use('/', provider.callback());
const port = process.env.PORT || 4000;
app.listen(port, () => {
    console.log(`OIDC Server listening on ${issuer}`);
});
