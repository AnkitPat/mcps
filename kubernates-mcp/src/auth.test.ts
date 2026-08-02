import { describe, it, expect, vi } from 'vitest';
import { getAuthConfig } from './auth.js';

describe('auth config', () => {
  it('should return token mode config', () => {
    vi.stubEnv('AUTH_MODE', 'token');
    vi.stubEnv('MCP_AUTH_TOKEN', 'test-token');
    
    const config = getAuthConfig();
    expect(config.mode).toBe('token');
    expect(config.staticToken).toBe('test-token');
  });
});
