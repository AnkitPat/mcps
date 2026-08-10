# OIDC OAuth Server Debug Context

## Problem Description
I am implementing an `oidc-provider` server using Express. The login flow completes successfully, but the subsequent consent interaction results in an infinite loop and eventually a `SessionNotFound` / `authorization request has expired` error, or sometimes an `Error: accountId mismatch`.

The logs show that the `login` step completes and sets an `accountId`, and the `consent` step is triggered. Inside the `consent` handler, the session correctly contains the `accountId`. Despite this, the interaction fails to proceed, triggering repeated consent prompts until the request expires.

## Current Interaction Handler (`src/server.ts`)
```typescript
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
        console.log(`Interaction GET handler: UID ${req.params.uid}, prompt: ${details.prompt.name}`);
        const { prompt, params, session } = details;

        if (prompt.name === 'login') {
            console.log('Rendering login page.');
            return res.sendFile(path.join(__dirname, 'views', 'login.html'));
        }

        if (prompt.name === 'consent') {
            console.log(`Consent GET handler: Processing UID ${req.params.uid}. Session:`, session);
            
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
                
                const result = {
                    consent: {},
                };
                
                console.log(`Consent GET handler: UID ${req.params.uid}, finishing interaction. Result:`, result);
                return await provider.interactionFinished(req, res, result, { mergeWithLastSubmission: true });
            }
            
            throw new Error('Manual consent not implemented');
        }
        
        throw new Error(`Unsupported prompt: ${prompt.name}`);
    } catch (err) {
        console.error('GET Interaction error:', err);
        next(err);
    }
});

app.post('/interaction/:uid', async (req, res, next) => {
    try {
        const details = await provider.interactionDetails(req, res);
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
            await provider.interactionFinished(req, res, result, { mergeWithLastSubmission: false });
        } else {
            res.status(401).send('Invalid email or password');
        }
    } catch (err) {
        console.error('POST Interaction error:', err);
        next(err);
    }
});

app.use('/', provider.callback());

const port = process.env.PORT || 4000;
app.listen(port, () => {
    console.log(`OIDC Server listening on ${issuer}`);
});
```

## OIDC Provider Configuration (`src/provider.ts`)
```typescript
import { Provider } from 'oidc-provider';
import * as jose from 'jose';
import fs from 'fs';
import path from 'path';
import { findUserByEmail } from './users.js';

// ... getKeys function ...

export const initProvider = async (issuer: string) => {
    const { privateKeyJwk } = await getKeys();

    const configuration = {
        clients: [
            {
                client_id: 'chatgpt',
                client_secret: process.env.CLIENT_SECRET,
                redirect_uris: ['https://chatgpt.com/callback', 'http://localhost:3000/callback'],
                response_types: ['code'],
                grant_types: ['authorization_code', 'refresh_token'],
            },
        ],
        jwks: {
            keys: [privateKeyJwk],
        },
        pkce: {
            required: () => true,
        },
        cookies: {
            keys: [process.env.SESSION_SECRET || 'a-very-long-and-secure-session-secret'],
        },
        features: {
            devInteractions: { enabled: false },
        },
        interactions: {
            url(ctx: any, interaction: any) {
                return `/interaction/${interaction.uid}`;
            },
        },
        claims: {
            openid: ['sub', 'role'],
        },
        findAccount: async (ctx: any, sub: any) => {
            const user = findUserByEmail(sub);
            if (!user) return undefined;
            return {
                sub,
                claims: () => ({ sub, role: user.role }),
            };
        },
    };

    return new Provider(issuer, configuration as any);
};
```
