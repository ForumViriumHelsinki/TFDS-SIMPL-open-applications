import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { KeycloakError, KeycloakTokenResponse } from 'types/authentication';

// Mock dependencies with hoisting to ensure they run before module imports
vi.mock('@/util/getEnv', () => ({
  getPublicEnv: vi.fn(() => ({
    PUBLIC_AUTH_KEYCLOAK_SERVER_URL: 'http://keycloak',
    PUBLIC_AUTH_KEYCLOAK_CLIENT_ID: 'clientId',
    PUBLIC_AUTH_KEYCLOAK_REALM: 'realm',
  })),
}));

vi.mock('@/util/authentication', () => ({
  LOGOUT_DELETE_COOKIES_QUERY_PARAM: 'logout_delete_cookies',
  pkceChallengeFromVerifier: vi.fn(),
  stripOauthParamsFromUrl: vi.fn(),
}));

import {
  buildLogoutUrl,
  isKeycloakError,
  isAuthenticationEnabled,
  createLoginURL,
  getAccessToken,
  refreshAccessToken,
} from '@/services/keycloak';

describe('keycloak service', () => {
  const mockEnv = {
    PUBLIC_AUTH_KEYCLOAK_SERVER_URL: 'http://keycloak',
    PUBLIC_AUTH_KEYCLOAK_CLIENT_ID: 'clientId',
    PUBLIC_AUTH_KEYCLOAK_REALM: 'realm',
  };

  const mockEnvDisabled = {
    PUBLIC_AUTH_KEYCLOAK_SERVER_URL: '',
    PUBLIC_AUTH_KEYCLOAK_CLIENT_ID: '',
    PUBLIC_AUTH_KEYCLOAK_REALM: '',
  };

  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    // Don't clear all mocks since we need the getPublicEnv mock to persist
    // Only clear fetch mock
    if (mockFetch) {
      mockFetch.mockClear();
    }

    // Reset authentication mocks
    const { pkceChallengeFromVerifier, stripOauthParamsFromUrl } = await import(
      '@/util/authentication'
    );
    vi.mocked(pkceChallengeFromVerifier).mockClear();
    vi.mocked(stripOauthParamsFromUrl).mockClear();

    // Mock fetch
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isKeycloakError', () => {
    it('should identify keycloak error correctly', () => {
      const error: KeycloakError = {
        error: 'invalid_grant',
        error_description: 'Invalid credentials',
      };

      expect(isKeycloakError(error)).toBe(true);
    });

    it('should identify keycloak success correctly', () => {
      const success: KeycloakTokenResponse = {
        access_token: 'token123',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_expires_in: 7200,
        refresh_token: 'refresh123',
        id_token: 'id123',
        'not-before-policy': 0,
        session_state: 'session123',
        scope: 'openid',
      };

      expect(isKeycloakError(success)).toBe(false);
    });

    it('should handle edge case with error property as falsy', () => {
      const notError = {
        error: undefined,
        access_token: 'token123',
      };

      expect(isKeycloakError(notError as any)).toBe(false);
    });
  });

  describe('isAuthenticationEnabled', () => {
    it('should return true when all auth config is present', async () => {
      const { getPublicEnv } = await import('@/util/getEnv');
      vi.mocked(getPublicEnv).mockReturnValue(mockEnv);

      expect(isAuthenticationEnabled()).toBe(true);
    });
  });

  describe('createLoginURL', () => {
    it('should create correct login URL', async () => {
      const { pkceChallengeFromVerifier, stripOauthParamsFromUrl } = await import(
        '@/util/authentication'
      );

      vi.mocked(stripOauthParamsFromUrl).mockReturnValue('http://localhost:3000/callback');
      vi.mocked(pkceChallengeFromVerifier).mockResolvedValue('challenge123');

      const redirectUri = 'http://localhost:3000/callback?code=auth';
      const pkceCodeVerifier = 'verifier123';

      const loginUrl = await createLoginURL(redirectUri, pkceCodeVerifier);

      expect(stripOauthParamsFromUrl).toHaveBeenCalledWith(redirectUri);
      expect(pkceChallengeFromVerifier).toHaveBeenCalledWith(pkceCodeVerifier);

      const url = new URL(loginUrl);
      expect(url.origin + url.pathname).toBe(
        'http://keycloak/auth/realms/realm/protocol/openid-connect/auth'
      );
      expect(url.searchParams.get('client_id')).toBe('clientId');
      expect(url.searchParams.get('response_type')).toBe('code');
      expect(url.searchParams.get('redirect_uri')).toBe('http://localhost:3000/callback');
      expect(url.searchParams.get('scope')).toBe('openid');
      expect(url.searchParams.get('code_challenge_method')).toBe('S256');
      expect(url.searchParams.get('code_challenge')).toBe('challenge123');
    });

    it('should handle complex redirect URIs', async () => {
      const { pkceChallengeFromVerifier, stripOauthParamsFromUrl } = await import(
        '@/util/authentication'
      );

      vi.mocked(stripOauthParamsFromUrl).mockReturnValue('https://app.example.com/oauth/callback');
      vi.mocked(pkceChallengeFromVerifier).mockResolvedValue('challenge456');

      const redirectUri = 'https://app.example.com/oauth/callback?state=abc&scope=read';
      const pkceCodeVerifier = 'verifier456';

      const loginUrl = await createLoginURL(redirectUri, pkceCodeVerifier);

      expect(stripOauthParamsFromUrl).toHaveBeenCalledWith(redirectUri);

      const url = new URL(loginUrl);
      expect(url.searchParams.get('redirect_uri')).toBe('https://app.example.com/oauth/callback');
      expect(url.searchParams.get('code_challenge')).toBe('challenge456');
    });
  });

  describe('getAccessToken', () => {
    it('should get access token successfully', async () => {
      const { stripOauthParamsFromUrl } = await import('@/util/authentication');

      vi.mocked(stripOauthParamsFromUrl).mockReturnValue('http://localhost:3000/callback');

      const mockResponse = {
        access_token: 'access123',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'refresh123',
      };

      mockFetch.mockResolvedValue({
        json: vi.fn().mockResolvedValue(mockResponse),
      });

      const code = 'auth_code_123';
      const pkceCodeVerifier = 'verifier123';
      const redirectUri = 'http://localhost:3000/callback?state=abc';

      const result = await getAccessToken(code, pkceCodeVerifier, redirectUri);

      expect(stripOauthParamsFromUrl).toHaveBeenCalledWith(redirectUri);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://keycloak/auth/realms/realm/protocol/openid-connect/token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: 'grant_type=authorization_code&client_id=clientId&code=auth_code_123&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcallback&code_verifier=verifier123',
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle token request errors', async () => {
      const { stripOauthParamsFromUrl } = await import('@/util/authentication');

      vi.mocked(stripOauthParamsFromUrl).mockReturnValue('http://localhost:3000/callback');

      const mockErrorResponse = {
        error: 'invalid_grant',
        error_description: 'Invalid authorization code',
      };

      mockFetch.mockResolvedValue({
        json: vi.fn().mockResolvedValue(mockErrorResponse),
      });

      const result = await getAccessToken(
        'invalid_code',
        'verifier123',
        'http://localhost:3000/callback'
      );

      expect(result).toEqual(mockErrorResponse);
      expect(isKeycloakError(result)).toBe(true);
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh access token successfully', async () => {
      const { stripOauthParamsFromUrl } = await import('@/util/authentication');

      vi.mocked(stripOauthParamsFromUrl).mockReturnValue('http://localhost:3000/callback');

      const mockResponse = {
        access_token: 'new_access123',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'new_refresh123',
      };

      mockFetch.mockResolvedValue({
        json: vi.fn().mockResolvedValue(mockResponse),
      });

      const refreshToken = 'old_refresh123';
      const pkceCodeVerifier = 'verifier123';
      const redirectUri = 'http://localhost:3000/callback';

      const result = await refreshAccessToken(refreshToken, pkceCodeVerifier, redirectUri);

      expect(stripOauthParamsFromUrl).toHaveBeenCalledWith(redirectUri);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://keycloak/auth/realms/realm/protocol/openid-connect/token',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: 'grant_type=refresh_token&client_id=clientId&refresh_token=old_refresh123&code_verifier=verifier123&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcallback',
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle refresh token errors', async () => {
      const { stripOauthParamsFromUrl } = await import('@/util/authentication');

      vi.mocked(stripOauthParamsFromUrl).mockReturnValue('http://localhost:3000/callback');

      const mockErrorResponse = {
        error: 'invalid_grant',
        error_description: 'Refresh token expired',
      };

      mockFetch.mockResolvedValue({
        json: vi.fn().mockResolvedValue(mockErrorResponse),
      });

      const result = await refreshAccessToken(
        'expired_refresh',
        'verifier123',
        'http://localhost:3000/callback'
      );

      expect(result).toEqual(mockErrorResponse);
      expect(isKeycloakError(result)).toBe(true);
    });

    it('should handle network errors', async () => {
      const { stripOauthParamsFromUrl } = await import('@/util/authentication');

      vi.mocked(stripOauthParamsFromUrl).mockReturnValue('http://localhost:3000/callback');

      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(
        refreshAccessToken('refresh123', 'verifier123', 'http://localhost:3000/callback')
      ).rejects.toThrow('Network error');
    });
  });

  describe('buildLogoutUrl', () => {
    it('builds the logout URL correctly', async () => {
      const { getPublicEnv } = await import('@/util/getEnv');
      vi.mocked(getPublicEnv).mockReturnValue(mockEnv);

      const keycloakBaseUrl = 'http://redirecthere.com';
      const id_token_hint = 'idTokenHint';
      const logoutUrl = buildLogoutUrl(keycloakBaseUrl, id_token_hint);

      expect(logoutUrl).toBe(
        'http://keycloak/auth/realms/realm/protocol/openid-connect/logout?client_id=clientId&id_token_hint=idTokenHint&post_logout_redirect_uri=http%3A%2F%2Fredirecthere.com%2F%3Flogout_delete_cookies%3Dtrue'
      );
    });

    it('should handle complex redirect URIs with existing parameters', () => {
      const redirectUri = 'http://example.com/logout?existing=param';
      const id_token_hint = 'token123';

      const logoutUrl = buildLogoutUrl(redirectUri, id_token_hint, false);

      const url = new URL(logoutUrl);
      expect(url.origin + url.pathname).toBe(
        'http://keycloak/auth/realms/realm/protocol/openid-connect/logout'
      );
      expect(url.searchParams.get('client_id')).toBe('clientId');
      expect(url.searchParams.get('id_token_hint')).toBe('token123');

      const postLogoutUri = url.searchParams.get('post_logout_redirect_uri');
      expect(postLogoutUri).toContain('http://example.com/logout');
      expect(postLogoutUri).toContain('existing=param');
      expect(postLogoutUri).toContain('logout_delete_cookies=true');
    });

    it('should handle localhost redirect URIs', () => {
      const redirectUri = 'http://localhost:3000/app';
      const id_token_hint = 'localhost_token';

      const logoutUrl = buildLogoutUrl(redirectUri, id_token_hint);

      const url = new URL(logoutUrl);
      const postLogoutUri = url.searchParams.get('post_logout_redirect_uri');
      expect(postLogoutUri).toContain('localhost:3000');
      expect(postLogoutUri).toContain('logout_delete_cookies=true');
    });

    it('should handle HTTPS redirect URIs', () => {
      const redirectUri = 'https://secure.example.com/oauth/logout';
      const id_token_hint = 'secure_token';

      const logoutUrl = buildLogoutUrl(redirectUri, id_token_hint);

      const url = new URL(logoutUrl);
      expect(url.protocol).toBe('http:'); // Keycloak server protocol

      const postLogoutUri = url.searchParams.get('post_logout_redirect_uri');
      expect(postLogoutUri).toContain('https://secure.example.com');
    });
  });

  describe('edge cases and integration', () => {
    it('should handle special characters in parameters', async () => {
      const { stripOauthParamsFromUrl } = await import('@/util/authentication');
      vi.mocked(stripOauthParamsFromUrl).mockReturnValue('http://localhost:3000/callback');

      const mockResponse = { access_token: 'token' };
      mockFetch.mockResolvedValue({
        json: vi.fn().mockResolvedValue(mockResponse),
      });

      // Test with special characters in code
      const specialCode = 'code+with/special=chars';
      const result = await getAccessToken(
        specialCode,
        'verifier',
        'http://localhost:3000/callback'
      );

      const [, options] = mockFetch.mock.calls[0];
      expect(options.body).toContain('code=code%2Bwith%2Fspecial%3Dchars');
      expect(result).toEqual(mockResponse);
    });

    it('should handle concurrent requests correctly', async () => {
      const { stripOauthParamsFromUrl } = await import('@/util/authentication');
      vi.mocked(stripOauthParamsFromUrl).mockReturnValue('http://localhost:3000/callback');

      const mockResponse1 = { access_token: 'token1' };
      const mockResponse2 = { access_token: 'token2' };

      mockFetch
        .mockResolvedValueOnce({ json: vi.fn().mockResolvedValue(mockResponse1) })
        .mockResolvedValueOnce({ json: vi.fn().mockResolvedValue(mockResponse2) });

      const [result1, result2] = await Promise.all([
        getAccessToken('code1', 'verifier1', 'http://localhost:3000/callback'),
        refreshAccessToken('refresh1', 'verifier2', 'http://localhost:3000/callback'),
      ]);

      expect(result1).toEqual(mockResponse1);
      expect(result2).toEqual(mockResponse2);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});
