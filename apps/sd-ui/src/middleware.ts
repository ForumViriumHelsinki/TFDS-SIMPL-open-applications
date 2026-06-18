import type { APIContext, MiddlewareNext } from 'astro';
import { isAuthenticationEnabled } from './services/keycloak';
import {
  deleteAuthenticationCookies,
  handleOAuthCallback,
  handleRefreshToken,
  hasUrlOauthParams,
  isLoggedIn,
  redirectToLogin,
  REFRESH_TOKEN_COOKIE,
  setCacheHeaders,
  shouldDeleteCookiesToLogout,
} from './util/authentication';
import { createAPIError } from '@/util/errors';
import { getPublicEnv } from '@/util/getEnv';

export const onRequest = async (ctx: APIContext, next: MiddlewareNext) => {
  // Bypass domain validation and auth for Kubernetes health probes
  if (ctx.url.pathname === '/status' || ctx.url.pathname === '/status/') {
    return setCacheHeaders(await next());
  }

  // Runtime Domain Validation
  const allowedDomainsStr = getPublicEnv().PUBLIC_ALLOWED_DOMAINS || '';
  if (allowedDomainsStr) {
    const allowedDomains = allowedDomainsStr.split(',').map(d => d.trim().replace('**.', ''));
    const forwardedHost = ctx.request.headers.get('x-forwarded-host') || ctx.url.hostname;
    
    const isAllowed = allowedDomains.some(domain => 
      forwardedHost === domain || forwardedHost.endsWith(`.${domain}`) || domain === '**'
    );

    if (!isAllowed) {
      return new Response('Forbidden: Host not allowed', { status: 403 });
    }
  }

  if (!isAuthenticationEnabled()) {
    return setCacheHeaders(await next());
  }
  if (shouldDeleteCookiesToLogout(ctx.url)) {
    deleteAuthenticationCookies(ctx.cookies);
  }
  if (!isLoggedIn(ctx) && hasUrlOauthParams(ctx.url.href)) {
    const response = await handleOAuthCallback(ctx);
    if (response) {
      return response;
    }
    return setCacheHeaders(await next());
  }

  if (!isLoggedIn(ctx) && ctx.cookies.has(REFRESH_TOKEN_COOKIE)) {
    const response = await handleRefreshToken(ctx);
    if (response) {
      return response;
    }
    return setCacheHeaders(await next());
  }
  if (!isLoggedIn(ctx) && !ctx.url.pathname.startsWith('/api')) {
    return setCacheHeaders(await redirectToLogin(ctx, ctx.url.href));
  }
  if (
    !isLoggedIn(ctx) &&
    !ctx.cookies.has(REFRESH_TOKEN_COOKIE) &&
    ctx.url.pathname.startsWith('/api')
  ) {
    const response = new Response(
      JSON.stringify(
        createAPIError(
          'UNAUTHORIZED',
          'You are not logged in',
          'Try refreshing the page to log in again'
        )
      ),
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return setCacheHeaders(response);
  }

  // Handling of /api calls returning 401 is missing
  return setCacheHeaders(await next());
};
