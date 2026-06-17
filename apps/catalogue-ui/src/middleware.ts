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
import { createAPIError } from '@simpl/vue-components';

export const onRequest = async (ctx: APIContext, next: MiddlewareNext) => {
  if (ctx.url.pathname.startsWith('/status') || !isAuthenticationEnabled()) {
    return setCacheHeaders(await next());
  }
  if (shouldDeleteCookiesToLogout(ctx.url)) {
    deleteAuthenticationCookies(ctx.cookies);
  }
  if (!isLoggedIn(ctx) && hasUrlOauthParams(ctx.url.href)) {
    const result = await handleOAuthCallback(ctx);
    if (result) return result;
    return setCacheHeaders(await next());
  }

  if (!isLoggedIn(ctx) && ctx.cookies.has(REFRESH_TOKEN_COOKIE)) {
    const result = await handleRefreshToken(ctx);
    if (result) return result;
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
