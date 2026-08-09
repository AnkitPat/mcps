import { Provider } from 'oidc-provider';
import * as jose from 'jose';
import fs from 'fs';
import path from 'path';
import { findUserByEmail } from './users.js';
import { PostgresAdapter } from './postgresAdapter.js';

// Load or generate a key pair for RS256
const getKeys = async () => {
    const privateKeyPath = 'src/keys/private.json';
    const publicKeyPath = 'src/keys/public.json';

    if (fs.existsSync(privateKeyPath) && fs.existsSync(publicKeyPath)) {
        const privateKeyJwk = JSON.parse(fs.readFileSync(privateKeyPath, 'utf8'));
        const publicKeyJwk = JSON.parse(fs.readFileSync(publicKeyPath, 'utf8'));
        return { privateKeyJwk, publicKeyJwk };
    }

    const { publicKey, privateKey } = await jose.generateKeyPair('RS256', { extractable: true });
    const privateKeyJwk = await jose.exportJWK(privateKey);
    const publicKeyJwk = await jose.exportJWK(publicKey);
    
    if (!fs.existsSync('src/keys')) fs.mkdirSync('src/keys');
    fs.writeFileSync(privateKeyPath, JSON.stringify(privateKeyJwk));
    fs.writeFileSync(publicKeyPath, JSON.stringify(publicKeyJwk));
    return { privateKeyJwk, publicKeyJwk };
};

export const initProvider = async (issuer: string) => {
    const { privateKeyJwk } = await getKeys();

    const configuration = {
        adapter: PostgresAdapter,
        clients: [
            {
                client_id: 'chatgpt',
                client_secret: process.env.CLIENT_SECRET,
                redirect_uris: ['https://chatgpt.com/callback', 'http://localhost:3000/callback'], // Added local dev redirect
                response_types: ['code'],
                grant_types: ['authorization_code', 'refresh_token'],
            },
        ],
        jwks: {
            keys: [privateKeyJwk],

        },
        // Enable PKCE
        pkce: {
            required: () => true,
        },
        cookies: {
            keys: [process.env.SESSION_SECRET || 'a-very-long-and-secure-session-secret'],
        },
        features: {
            devInteractions: { enabled: false }, // Disable devInteractions to use custom ones
        },
        interactions: {
            url(ctx: any, interaction: any) {
                return `/interaction/${interaction.uid}`;
            },
        },
        // Combined claims logic
        claims: {
            openid: ['sub', 'role'],
        },
        renderError: async (ctx: any, out: any, error: any) => {
            console.error('OIDC Render Error:', error);
            ctx.type = 'html';
            ctx.body = `<h1>Error</h1><p>${error.message || error.error_description}</p>`;
        },
        findAccount: async (ctx: any, sub: any) => {
            const user = findUserByEmail(sub);
            if (!user) return undefined;
            return {
                accountId: sub,
                claims: () => ({ sub, role: user.role }),
            };
        },
    };

    return new Provider(issuer, configuration as any);
};
