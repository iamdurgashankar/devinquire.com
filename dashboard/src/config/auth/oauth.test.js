
import { SIMPLE_OAUTH_CONFIG, validateSimpleOAuthConfig } from './oauth';

// Mock process.env
const originalEnv = process.env;

describe('OAuth Configuration', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('should use SIMPLE_ prefixed variables if present', () => {
    process.env.REACT_APP_SIMPLE_GOOGLE_CLIENT_ID = 'simple-google-id';
    process.env.REACT_APP_GOOGLE_CLIENT_ID = 'legacy-google-id';
    
    // Re-require to pick up new env vars
    jest.isolateModules(() => {
      const { SIMPLE_OAUTH_CONFIG } = require('./oauth');
      expect(SIMPLE_OAUTH_CONFIG.google.clientId).toBe('simple-google-id');
    });
  });

  test('should fallback to legacy variables if SIMPLE_ are missing', () => {
    delete process.env.REACT_APP_SIMPLE_GOOGLE_CLIENT_ID;
    process.env.REACT_APP_GOOGLE_CLIENT_ID = 'legacy-google-id';
    
    jest.isolateModules(() => {
      const { SIMPLE_OAUTH_CONFIG } = require('./oauth');
      expect(SIMPLE_OAUTH_CONFIG.google.clientId).toBe('legacy-google-id');
    });
  });

  test('should be valid when required config is present', () => {
    process.env.REACT_APP_SIMPLE_GOOGLE_CLIENT_ID = 'google-id';
    process.env.REACT_APP_SIMPLE_GOOGLE_REDIRECT_URI = 'http://localhost/callback';
    process.env.REACT_APP_SIMPLE_GITHUB_CLIENT_ID = 'github-id';
    process.env.REACT_APP_SIMPLE_GITHUB_REDIRECT_URI = 'http://localhost/callback';

    jest.isolateModules(() => {
      const { validateSimpleOAuthConfig } = require('./oauth');
      const result = validateSimpleOAuthConfig();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  test('should be invalid when config is missing', () => {
    delete process.env.REACT_APP_SIMPLE_GOOGLE_CLIENT_ID;
    delete process.env.REACT_APP_GOOGLE_CLIENT_ID;

    jest.isolateModules(() => {
      const { validateSimpleOAuthConfig } = require('./oauth');
      const result = validateSimpleOAuthConfig();
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Google Client ID is missing');
    });
  });
});
