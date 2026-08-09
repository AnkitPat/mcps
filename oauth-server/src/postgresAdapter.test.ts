import { PostgresAdapter } from './postgresAdapter.js';

// Simple mock pool
const mockPool = {
  query: async (...args: any[]) => {
    throw new Error('DB Error');
  }
};

async function runTests() {
  const adapter = new PostgresAdapter('test-model', mockPool);
  
  // Test upsert error handling
  try {
    await adapter.upsert('id', {}, 10);
    throw new Error('Should have thrown error');
  } catch (e: any) {
    if (e.message !== 'DB Error') {
        throw new Error('Upsert error handling failed: ' + e.message);
    }
    console.log('Upsert error handling passed');
  }

  console.log('Tests passed');
}

runTests().catch(console.error);
