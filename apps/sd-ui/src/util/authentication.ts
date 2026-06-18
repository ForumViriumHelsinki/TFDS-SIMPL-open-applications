import {
  createLoginURL,
  getAccessToken,
  isKeycloakError,
  refreshAccessToken,
} from '@/services/keycloak';
import type { APIContext, AstroCookies } from 'astro';
import { createAPIError } from '@/util/errors';
import type { KeycloakError, KeycloakTokenResponse } from '@/types/authentication';
import { getPublicEnv } from '@/util/getEnv';

export const ACCESS_TOKEN_COOKIE = 'token';
export const REFRESH_TOKEN_COOKIE = 'refreshToken';
export const ID_TOKEN_COOKIE = 'idToken';
export const AUTH_COOKIES = [ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, ID_TOKEN_COOKIE];

export const PKCE_COOKIE = 'pkceCodeVerifier';

export const LOGOUT_DELETE_COOKIES_QUERY_PARAM = 'logout_delete_cookies';

export const generateRandomString = () => {
  const array = new Uint32Array(28);
  crypto.getRandomValues(array);
  return Array.from(array, (dec) => ('0' + dec.toString(16)).slice(-2)).join('');
};

const sha256 = (plain: string) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return crypto.subtle.digest('SHA-256', data);
};

const base64urlencode = (str: ArrayBuffer) => {
  // Convert the ArrayBuffer to string using Uint8 array to conver to what btoa accepts.
  // btoa accepts chars only within ascii 0-255 and base64 encodes them.
  // Then convert the base64 encoded to base64url encoded
  //   (replace + with -, replace / with _, trim trailing =)
  let result = btoa(String.fromCharCode.apply(null, [...new Uint8Array(str)]))
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  // Remove trailing equals signs efficiently without backtracking
  while (result.endsWith('=')) {
    result = result.slice(0, -1);
  }

  return result;
};

export const pkceChallengeFromVerifier = async (pkceCodeVerifier: string) => {
  const hashed = await sha256(pkceCodeVerifier);
  return base64urlencode(hashed);
};

export const isLoggedIn = (ctx: APIContext) => {
  return ctx.cookies.has(ACCESS_TOKEN_COOKIE);
};

export const setNewPkceCodeVerifier = (ctx: APIContext) => {
  const pkceCodeVerifier = generateRandomString();
  ctx.cookies.set(PKCE_COOKIE, pkceCodeVerifier, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
  });
  return pkceCodeVerifier;
};

export const setNewTokenCookie = (
  ctx: APIContext,
  tokenName: string,
  token: string,
  expires_in: number
) => {
  ctx.cookies.set(tokenName, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: expires_in,
    path: '/',
  });
};

export const deleteAuthenticationCookies = (cookies: AstroCookies) => {
  AUTH_COOKIES.forEach((cookie) => {
    cookies.delete(cookie, { path: '/' });
  });
};

export interface SetCookiesRecord {
  [key: string]: { expires: number };
}

export const setTokenCookies = (ctx: APIContext, response: KeycloakTokenResponse) => {
  const setCookies: SetCookiesRecord = {};

  if (response.access_token) {
    setNewTokenCookie(ctx, ACCESS_TOKEN_COOKIE, response.access_token, response.expires_in);
    setCookies[ACCESS_TOKEN_COOKIE] = { expires: response.expires_in };
  }

  if (response.refresh_token) {
    setNewTokenCookie(
      ctx,
      REFRESH_TOKEN_COOKIE,
      response.refresh_token,
      response.refresh_expires_in
    );
    setCookies[REFRESH_TOKEN_COOKIE] = { expires: response.refresh_expires_in };
  }

  if (response.id_token) {
    setNewTokenCookie(ctx, ID_TOKEN_COOKIE, response.id_token, response.expires_in);
    setCookies[ID_TOKEN_COOKIE] = { expires: response.expires_in };
  }

  return setCookies;
};

export const redirectToLogin = async (ctx: APIContext, redirectUrl?: string) => {
  const pkceCodeVerifier = setNewPkceCodeVerifier(ctx);

  const env = getPublicEnv();
  const baseUrl = env.PUBLIC_BASE_URL || ctx.url.origin;
  
  let finalRedirectUrl = redirectUrl ?? ctx.url.href;
  if (finalRedirectUrl.startsWith('http://localhost') || finalRedirectUrl.startsWith('https://localhost')) {
    finalRedirectUrl = finalRedirectUrl.replace(/^https?:\/\/localhost(:\d+)?/, baseUrl);
  }

  const loginUrl = await createLoginURL(finalRedirectUrl, pkceCodeVerifier);
  return new Response('', {
    status: 302,
    headers: {
      Location: loginUrl,
    },
  });
};

export const redirectClientToLogin = async (redirectUrl?: string) => {
  const pkceCodeVerifier = generateRandomString();

  const loginUrl = await createLoginURL(redirectUrl ?? window.location.href, pkceCodeVerifier);
  window.location.href = loginUrl;
};

export const setAuthorizationHeader = (token: string | undefined, headers: Headers | undefined) => {
  if (!token) {
    return headers;
  }
  if (!headers) {
    headers = new Headers();
  }

  headers.set('Authorization', `Bearer ${token}`);
  return headers;
};

export const hasUrlOauthParams = (url: string) => {
  const currentUrl = new URL(url);
  return (
    currentUrl.searchParams.has('code') &&
    currentUrl.searchParams.has('session_state') &&
    currentUrl.searchParams.has('iss')
  );
};

export const stripOauthParamsFromUrl = (url: string) => {
  const currentUrl = new URL(url);

  currentUrl.searchParams.delete('code');
  currentUrl.searchParams.delete('session_state');
  currentUrl.searchParams.delete('iss');
  return currentUrl.toString();
};

export const clearOAuthParamsFromWindow = (window: Window) => {
  if (!window) {
    return;
  }
  const currentUrl = new URL(window.location.toString());

  currentUrl.searchParams.delete('code');
  currentUrl.searchParams.delete('session_state');
  currentUrl.searchParams.delete('iss');

  if (window.location.toString() !== currentUrl.toString()) {
    window.location = currentUrl.toString();
  }
};

export const createAuthErrorResponse = (response: KeycloakError) =>
  new Response(
    JSON.stringify(createAPIError(response.error, response.error, response.error_description)),
    { status: 401 }
  );

export const shouldDeleteCookiesToLogout = (url: URL) => {
  return url.searchParams.has(LOGOUT_DELETE_COOKIES_QUERY_PARAM, 'true');
};

export const setCacheHeaders = (response: Response) => {
  if (response.headers.get('Content-Type')?.includes('text/html')) {
    try {
      response.headers.set(
        'Cache-Control',
        'no-store, private, no-cache, must-revalidate, proxy-revalidate'
      );
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('X-Frame-Options', 'SAMEORIGIN');
      response.headers.set('Content-Security-Policy', "frame-ancestors 'self'");
    } catch (err) {
      console.error(
        `${response.url} failed to set cache headers. Content-Type: ${response.headers.get('Content-Type')}. Response code: ${response.status}`
      );
      console.error(err);
    }
  }
  return response;
};

export async function handleOAuthCallback(ctx: APIContext): Promise<Response | null> {
  const pkceCodeVerifier = ctx.cookies.get(PKCE_COOKIE)?.value;
  if (!pkceCodeVerifier) {
    return setCacheHeaders(
      createAuthErrorResponse({
        error: 'invalid_request',
        error_description: 'Missing PKCE code verifier',
      })
    );
  }

  const env = getPublicEnv();
  const baseUrl = env.PUBLIC_BASE_URL || ctx.url.origin;
  
  let redirectUri = ctx.url.href;
  if (redirectUri.startsWith('http://localhost') || redirectUri.startsWith('https://localhost')) {
    redirectUri = redirectUri.replace(/^https?:\/\/localhost(:\d+)?/, baseUrl);
  }

  const data = await getAccessToken(
    ctx.url.searchParams.get('code')!,
    pkceCodeVerifier,
    redirectUri
  );
  if (isKeycloakError(data)) {
    return setCacheHeaders(createAuthErrorResponse(data));
  }

  setTokenCookies(ctx, data);
  ctx.cookies.delete(PKCE_COOKIE);
  return null;
}

export async function handleRefreshToken(ctx: APIContext): Promise<Response | null> {
  const pkceCodeVerifier = setNewPkceCodeVerifier(ctx);

  const data = await refreshAccessToken(
    ctx.cookies.get(REFRESH_TOKEN_COOKIE)!.value,
    pkceCodeVerifier,
    ctx.url.href
  );
  if (isKeycloakError(data)) {
    return setCacheHeaders(createAuthErrorResponse(data));
  }

  setTokenCookies(ctx, data);
  ctx.cookies.delete(PKCE_COOKIE);
  return null;
}
