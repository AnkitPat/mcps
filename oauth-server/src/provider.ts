import { Provider, Configuration } from 'oidc-provider';
import { findUserByEmail } from './users.js';
import { PostgresAdapter } from './postgresAdapter.js';

export const initProvider = async (issuer: string) => {
    const configuration: Configuration = {
        adapter: PostgresAdapter as any,
        clients: [
            {
                client_id: 'chatgpt',
                client_secret: process.env.CLIENT_SECRET,
                redirect_uris: ['https://chatgpt.com/callback', 'http://localhost:3000/callback'],
                response_types: ['code'],
                grant_types: ['authorization_code', 'refresh_token'],
            },
        ],
        // Combined claims logic
        claims: {
            openid: ['sub', 'role'],
        },
        findAccount: async (ctx: any, sub: string) => {
            const user = findUserByEmail(sub);
            if (!user) return undefined;
            return {
                sub,
                accountId: sub,
                claims: () => ({ sub, role: user.role }),
            };
        },
    };

    return new Provider(issuer, configuration);
};
