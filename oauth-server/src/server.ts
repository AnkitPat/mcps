console.log('--- SERVER STARTING ---');
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

// DEBUG: Log client metadata
(async () => {
    const client = await provider.Client.find('chatgpt');
    console.log('Client metadata for "chatgpt":', client);
})();

// Interaction routes
app.get('/interaction/:uid', async (req, res, next) => {
    try {
        const details = await provider.interactionDetails(req, res);
        console.log(`Interaction GET handler: UID ${req.params.uid}, prompt: ${details.prompt.name}`);
        const { prompt, params, session } = details;

        if (prompt.name === 'login') {
            console.log('Rendering login page.');
            return res.sendFile(path.join(__dirname, 'views', 'login.html'));
        }

        if (prompt.name === 'consent') {
            console.log(`Processing consent for UID: ${req.params.uid}`);
            
            // Auto-consent logic for trusted client 'chatgpt'
            if (params.client_id === 'chatgpt') {
                console.log('Client is "chatgpt", proceeding to auto-consent.');
                
                let grant;
                if (details.grantId) {
                    grant = await provider.Grant.find(details.grantId);
                }
                
                if (!grant) {
                    const accountId = session?.accountId;
                    if (!accountId) {
                        throw new Error('No accountId in session during consent');
                    }
                    grant = new provider.Grant({
                        accountId,
                        clientId: params.client_id as string,
                    });
                }

                // Add all scopes from params
                if (params.scope) {
                    grant.addOIDCScope(params.scope as string);
                } else {
                    grant.addOIDCScope('openid');
                }
                
                // Add claims if missing
                if (prompt.details.missingOIDCClaims) {
                    grant.addOIDCClaims(prompt.details.missingOIDCClaims as string[]);
                }
                
                // 🔑 Persist the grant and capture its id
                const grantId = await grant.save();
                
                const result = {
                    consent: {
                        grantId,
                    },
                };
                
                console.log(`Consent GET handler: UID ${req.params.uid}, finishing interaction. Result:`, result);
                return await provider.interactionFinished(req, res, result, { mergeWithLastSubmission: true });
            }
            
            // If not chatgpt, handle manual consent here (or throw error)
            console.log(`Consent requested for non-trusted client: ${params.client_id}`);
            throw new Error('Manual consent not implemented');
        }
        
        console.log(`Unsupported prompt name: ${prompt.name}`);
        throw new Error(`Unsupported prompt: ${prompt.name}`);
    } catch (err) {
        console.error('GET Interaction error:', err);
        next(err);
    }
});

app.post('/interaction/:uid', async (req, res, next) => {
    try {
        const details = await provider.interactionDetails(req, res);
        console.log(`Interaction POST handler: UID ${req.params.uid}, prompt: ${details.prompt.name}`);
        const { prompt } = details;

        if (prompt.name !== 'login') {
            throw new Error(`Invalid prompt for POST: ${prompt.name}`);
        }

        const { email, password } = req.body;
        const user = findUserByEmail(email);
        
        if (user && await verifyPassword(user, password)) {
            const result = { 
                login: { 
                    accountId: user.email 
                } 
            };
            console.log(`Login POST handler: User ${user.email} authenticated. UID ${req.params.uid}. Finishing interaction with result:`, result);
            await provider.interactionFinished(req, res, result, { mergeWithLastSubmission: false });
        } else {
            res.status(401).send('Invalid email or password');
        }
    } catch (err) {
        console.error('POST Interaction error:', err);
        next(err);
    }
});

// Mount the OIDC provider
app.use((req, res, next) => {
    console.log(`DEBUG: Incoming request to ${req.path}. Query:`, req.query);
    next();
});
app.use('/', provider.callback());

const port = process.env.PORT || 4000;
app.listen(port, () => {
    console.log(`OIDC Server listening on ${issuer}`);
});
