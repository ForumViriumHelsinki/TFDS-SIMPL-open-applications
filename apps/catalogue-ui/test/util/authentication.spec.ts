import { describe, it, expect, vi, beforeAll } from 'vitest';
import type { APIContext, AstroCookies } from 'astro';
import {
  generateRandomString,
  pkceChallengeFromVerifier,
  isLoggedIn,
  setNewPkceCodeVerifier,
  setNewTokenCookie,
  deleteAuthenticationCookies,
  setTokenCookies,
  redirectToLogin,
  redirectClientToLogin,
  setAuthorizationHeader,
  fetchTokenClientSide,
  hasUrlOauthParams,
  stripOauthParamsFromUrl,
  clearOAuthParamsFromWindow,
  createAuthErrorResponse,
  shouldDeleteCookiesToLogout,
  setCacheHeaders,
  handleOAuthCallback,
  handleRefreshToken,
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  ID_TOKEN_COOKIE,
  PKCE_COOKIE,
} from '@/util/authentication';
import type { KeycloakTokenResponse } from 'types/authentication';

vi.mock('@/util/getEnv', () => ({
  getPublicEnv: vi.fn(() => ({
    PUBLIC_AUTH_KEYCLOAK_SERVER_URL: 'http://keycloak',
    PUBLIC_AUTH_KEYCLOAK_CLIENT_ID: 'clientId',
    PUBLIC_AUTH_KEYCLOAK_REALM: 'realm',
  })),
}));

vi.mock('@/services/keycloak', () => ({
  createLoginURL: vi
    .fn()
    .mockResolvedValue(
      'http://keycloak/auth/realms/realm/protocol/openid-connect/auth?client_id=clientId&response_type=code&redirect_uri=http%3A%2F%2Fexample.com%2Ftest%3Fquery%3Dvalue'
    ),
  getAccessToken: vi.fn(),
  refreshAccessToken: vi.fn(),
  isKeycloakError: vi.fn(),
}));

describe('authentication utils', () => {
  beforeAll(() => {
    Object.defineProperty(global, 'crypto', {
      value: {
        getRandomValues: vi.fn().mockReturnValue(new Uint8Array(32)),
        subtle: {
          digest: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
        },
      },
    });
  });

  it('generateRandomString should return a string of length 56', () => {
    const randomString = generateRandomString();
    expect(randomString).toHaveLength(56);
  });

  it('pkceChallengeFromVerifier should return a base64 URL encoded string', async () => {
    const pkceCodeVerifier = 'codeVerifier';
    const pkceChallenge = await pkceChallengeFromVerifier(pkceCodeVerifier);
    expect(pkceChallenge).toHaveLength(43);
    expect(pkceChallenge).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('isLoggedIn should return true if access token cookie is present', () => {
    const ctx = { cookies: new Map([[ACCESS_TOKEN_COOKIE, 'token']]) } as unknown as APIContext;
    expect(isLoggedIn(ctx)).toBe(true);
  });

  it('isLoggedIn should return false if access token cookie is not present', () => {
    const ctx = { cookies: new Map() } as unknown as APIContext;
    expect(isLoggedIn(ctx)).toBe(false);
  });

  it('setNewPkceCodeVerifier should set and return a new PKCE code verifier', () => {
    const ctx = { cookies: { set: vi.fn() } } as unknown as APIContext;
    const pkceCodeVerifier = setNewPkceCodeVerifier(ctx);
    expect(ctx.cookies.set).toHaveBeenCalledWith(PKCE_COOKIE, pkceCodeVerifier);
    expect(pkceCodeVerifier).toHaveLength(56);
  });

  it('setNewTokenCookie should set a new token cookie', async () => {
    const ctx = { cookies: { set: vi.fn() } } as unknown as APIContext;
    await setNewTokenCookie(ctx, ACCESS_TOKEN_COOKIE, 'token', 3600);
    expect(ctx.cookies.set).toHaveBeenCalledWith(ACCESS_TOKEN_COOKIE, 'token', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 3600,
      path: '/',
    });
  });

  it('deleteAuthenticationCookies should delete all auth cookies', () => {
    const cookies = { delete: vi.fn() };
    deleteAuthenticationCookies(cookies as unknown as AstroCookies);
    expect(cookies.delete).toHaveBeenCalledWith(ACCESS_TOKEN_COOKIE);
    expect(cookies.delete).toHaveBeenCalledWith(REFRESH_TOKEN_COOKIE);
    expect(cookies.delete).toHaveBeenCalledWith(ID_TOKEN_COOKIE);
  });

  it('setTokenCookies should set all token cookies', async () => {
    const ctx = { cookies: { set: vi.fn() } } as unknown as APIContext;
    const response: KeycloakTokenResponse = {
      access_token: 'access_token',
      refresh_token: 'refresh_token',
      id_token: 'id_token',
      expires_in: 3600,
      refresh_expires_in: 7200,
      token_type: 'Bearer',
      'not-before-policy': 0,
      session_state: 'session_state',
      scope: 'openid',
    };
    const setCookies = setTokenCookies(ctx, response);
    expect(ctx.cookies.set).toHaveBeenCalledWith(ACCESS_TOKEN_COOKIE, 'access_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 3600,
      path: '/',
    });
    expect(ctx.cookies.set).toHaveBeenCalledWith(REFRESH_TOKEN_COOKIE, 'refresh_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7200,
      path: '/',
    });
    expect(ctx.cookies.set).toHaveBeenCalledWith(ID_TOKEN_COOKIE, 'id_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 3600,
      path: '/',
    });
    expect(setCookies).toEqual({
      [ACCESS_TOKEN_COOKIE]: { expires: 3600 },
      [REFRESH_TOKEN_COOKIE]: { expires: 7200 },
      [ID_TOKEN_COOKIE]: { expires: 3600 },
    });
  });

  it('redirectToLogin should return a response with 302 status and login URL', async () => {
    const ctx = {
      cookies: { set: vi.fn() },
    } as unknown as APIContext;
    const response = await redirectToLogin(ctx, 'http://example.com/test?query=value');
    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toContain(
      `http://keycloak/auth/realms/realm/protocol/openid-connect/auth?client_id=clientId&response_type=code&redirect_uri=${encodeURIComponent('http://example.com/test?query=value')}`
    );
  });

  it('redirectClientToLogin should set window location to login URL', async () => {
    const redirectUrl = 'http://example.com/test?query=value';
    vi.stubGlobal('window', { location: { href: redirectUrl } });
    await redirectClientToLogin();
    expect(window.location.href).toContain(
      `http://keycloak/auth/realms/realm/protocol/openid-connect/auth?client_id=clientId&response_type=code&redirect_uri=${encodeURIComponent(redirectUrl)}`
    );
  });

  it('setAuthorizationHeader should set Authorization header', () => {
    const headers = new Headers();
    setAuthorizationHeader('token', headers);
    expect(headers.get('Authorization')).toBe('Bearer token');
  });

  it('fetchTokenClientSide should return token from local API', async () => {
    const token = await fetchTokenClientSide('keycloakToken');
    expect(token).toBe('keycloakToken');
  });

  it('hasUrlOauthParams should return true if URL has OAuth params', () => {
    const url = 'http://localhost?code=123&session_state=abc&iss=xyz';
    expect(hasUrlOauthParams(url)).toBe(true);

    const negativeUrl = 'http://localhost?sdfafa=123&ewrewrw=abc';
    expect(hasUrlOauthParams(negativeUrl)).toBe(false);
  });

  it('stripOauthParamsFromUrl should remove OAuth params from URL', () => {
    const url = 'http://localhost?code=123&session_state=abc&iss=xyz&thisshould=stay';
    const strippedUrl = stripOauthParamsFromUrl(url);
    expect(strippedUrl).toBe('http://localhost/?thisshould=stay');
  });

  it('clearOAuthParamsFromWindow should remove OAuth params from window location', () => {
    const window = { location: new URL('http://localhost?code=123&session_state=abc&iss=xyz') };
    clearOAuthParamsFromWindow(window as unknown as Window);
    expect(window.location.toString()).toBe('http://localhost/');
  });

  it('createAuthErrorResponse should return a response with 401 status', () => {
    const response = createAuthErrorResponse({
      error: 'error',
      error_description: 'error_description',
    });
    expect(response.status).toBe(401);
  });

  it('shouldDeleteCookiesToLogout should return true if URL has logout_delete_cookies param', () => {
    const url = new URL('http://localhost?logout_delete_cookies=true');
    expect(shouldDeleteCookiesToLogout(url)).toBe(true);
  });

  it('setCacheHeaders should set cache headers', () => {
    const htmlResponse = new Response(null, {
      headers: new Headers({
        'Content-Type': 'text/html',
      }),
    });
    setCacheHeaders(htmlResponse);
    expect(htmlResponse.headers.get('Cache-Control')).toBe(
      'no-store, private, no-cache, must-revalidate, proxy-revalidate'
    );
    expect(htmlResponse.headers.get('Pragma')).toBe('no-cache');

    const jsonResponse = new Response(null, {
      headers: new Headers({
        'Content-Type': 'application/json',
      }),
    });

    setCacheHeaders(jsonResponse);
    expect(jsonResponse.headers.get('Cache-Control')).toBe(null);
    expect(jsonResponse.headers.get('Pragma')).toBe(null);
  });

  describe('handleOAuthCallback', () => {
    it('should return error response when PKCE code verifier is missing', async () => {
      const ctx = {
        cookies: { get: vi.fn().mockReturnValue(undefined), delete: vi.fn() },
        url: {
          searchParams: { get: vi.fn().mockReturnValue('code123') },
          href: 'http://localhost',
        },
      } as unknown as APIContext;

      const result = await handleOAuthCallback(ctx);

      expect(result).toBeInstanceOf(Response);
      expect(result?.status).toBe(401);
    });

    it('should return error response when Keycloak returns an error', async () => {
      const { getAccessToken, isKeycloakError } = await import('@/services/keycloak');
      const keycloakError = { error: 'invalid_grant', error_description: 'Invalid code' };

      vi.mocked(getAccessToken).mockResolvedValue(keycloakError);
      vi.mocked(isKeycloakError).mockReturnValue(true);

      const ctx = {
        cookies: {
          get: vi.fn().mockReturnValue({ value: 'pkceVerifier' }),
          delete: vi.fn(),
        },
        url: {
          searchParams: { get: vi.fn().mockReturnValue('code123') },
          href: 'http://localhost',
        },
      } as unknown as APIContext;

      const result = await handleOAuthCallback(ctx);

      expect(result).toBeInstanceOf(Response);
      expect(result?.status).toBe(401);
      expect(getAccessToken).toHaveBeenCalledWith('code123', 'pkceVerifier', 'http://localhost');
    });

    it('should handle successful OAuth callback and set token cookies', async () => {
      const { getAccessToken, isKeycloakError } = await import('@/services/keycloak');
      const tokenResponse: KeycloakTokenResponse = {
        access_token: 'access_token',
        refresh_token: 'refresh_token',
        id_token: 'id_token',
        expires_in: 3600,
        refresh_expires_in: 7200,
        token_type: 'Bearer',
        'not-before-policy': 0,
        session_state: 'session_state',
        scope: 'openid',
      };

      vi.mocked(getAccessToken).mockResolvedValue(tokenResponse);
      vi.mocked(isKeycloakError).mockReturnValue(false);

      const ctx = {
        cookies: {
          get: vi.fn().mockReturnValue({ value: 'pkceVerifier' }),
          delete: vi.fn(),
          set: vi.fn(),
        },
        url: {
          searchParams: { get: vi.fn().mockReturnValue('code123') },
          href: 'http://localhost',
        },
      } as unknown as APIContext;

      const result = await handleOAuthCallback(ctx);

      expect(result).toBeNull();
      expect(ctx.cookies.delete).toHaveBeenCalledWith(PKCE_COOKIE);
      expect(ctx.cookies.set).toHaveBeenCalledTimes(3);
    });
  });

  describe('handleRefreshToken', () => {
    it('should return error response when Keycloak returns an error', async () => {
      const { refreshAccessToken, isKeycloakError } = await import('@/services/keycloak');
      const keycloakError = { error: 'invalid_token', error_description: 'Token expired' };

      vi.mocked(refreshAccessToken).mockResolvedValue(keycloakError);
      vi.mocked(isKeycloakError).mockReturnValue(true);

      const ctx = {
        cookies: {
          get: vi.fn().mockReturnValue({ value: 'refreshToken123' }),
          delete: vi.fn(),
          set: vi.fn(),
        },
        url: { href: 'http://localhost' },
      } as unknown as APIContext;

      const result = await handleRefreshToken(ctx);

      expect(result).toBeInstanceOf(Response);
      expect(result?.status).toBe(401);
      expect(refreshAccessToken).toHaveBeenCalledWith(
        'refreshToken123',
        expect.any(String),
        'http://localhost'
      );
    });

    it('should handle successful token refresh and set new token cookies', async () => {
      const { refreshAccessToken, isKeycloakError } = await import('@/services/keycloak');
      const tokenResponse: KeycloakTokenResponse = {
        access_token: 'new_access_token',
        refresh_token: 'new_refresh_token',
        id_token: 'new_id_token',
        expires_in: 3600,
        refresh_expires_in: 7200,
        token_type: 'Bearer',
        'not-before-policy': 0,
        session_state: 'new_session_state',
        scope: 'openid',
      };

      vi.mocked(refreshAccessToken).mockResolvedValue(tokenResponse);
      vi.mocked(isKeycloakError).mockReturnValue(false);

      const ctx = {
        cookies: {
          get: vi.fn().mockReturnValue({ value: 'refreshToken123' }),
          delete: vi.fn(),
          set: vi.fn(),
        },
        url: { href: 'http://localhost' },
      } as unknown as APIContext;

      const result = await handleRefreshToken(ctx);

      expect(result).toBeNull();
      expect(ctx.cookies.delete).toHaveBeenCalledWith(PKCE_COOKIE);
      expect(ctx.cookies.set).toHaveBeenCalledTimes(4);
    });
  });
});
