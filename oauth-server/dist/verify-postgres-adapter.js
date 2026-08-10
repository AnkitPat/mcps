import { PostgresAdapter } from './postgresAdapter.js';
import pool from './db.js';
async function verify() {
    const adapter = new PostgresAdapter('AccessToken');
    const id = 'test-id';
    const payload = { sub: 'user123', grantId: 'grant123' };
    const expiresIn = 3600;
    console.log('Upserting...');
    await adapter.upsert(id, payload, expiresIn);
    console.log('Finding...');
    const found = await adapter.find(id);
    console.log('Found:', found);
    if (found?.sub !== payload.sub) {
        throw new Error('Verification failed!');
    }
    console.log('Destroying...');
    await adapter.destroy(id);
    console.log('Finding after destroy...');
    const afterDestroy = await adapter.find(id);
    console.log('Found after destroy:', afterDestroy);
    if (afterDestroy !== undefined) {
        throw new Error('Destroy failed!');
    }
    console.log('Verification passed!');
    await pool.end();
}
verify().catch(console.error);
