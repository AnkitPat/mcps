import { Provider } from 'oidc-provider';
import * as jose from 'jose';
import fs from 'fs';
import path from 'path';
import { findUserByEmail } from './users.js';

// Generate a key pair for RS256
const generateKeys = async () => {
    const { publicKey, privateKey } = await jose.generateKeyPair('RS256', { extractable: true });
    const privateKeyJwk = await jose.exportJWK(privateKey);
    const publicKeyJwk = await jose.exportJWK(publicKey);
    
    // In a real production app, store these securely, not in the src folder
    if (!fs.existsSync('src/keys')) fs.mkdirSync('src/keys');
    fs.writeFileSync('src/keys/private.json', JSON.stringify(privateKeyJwk));
    fs.writeFileSync('src/keys/public.json', JSON.stringify(publicKeyJwk));
    return { privateKeyJwk, publicKeyJwk };
};

export const initProvider = async (issuer: string) => {
    const { privateKeyJwk } = await generateKeys();

    const configuration = {
        clients: [
            {
                client_id: 'chatgpt',
                client_secret: process.env.CLIENT_SECRET,
                redirect_uris: ['https://chatgpt.com/callback'], // Update with actual redirect
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
        interactions: {
            url(ctx, interaction) {
                return `/interaction/${interaction.uid}`;
            },
        },
        claims: {
            openid: ['sub', 'role'],
        },
        findAccount: async (ctx, sub) => {
            const user = findUserByEmail(sub);
            if (!user) return undefined;
            return {
                sub,
                claims: () => ({ sub, role: user.role }),
            };
        },
    };

    return new Provider(issuer, configuration);
};
