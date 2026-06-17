import { buildLogoutUrl } from '@/services/keycloak';
import { ID_TOKEN_COOKIE } from '@/util/authentication';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ cookies, url }) => {
  const redirectUri = url.searchParams.get('redirectUri');

  if (!redirectUri) {
    return new Response('Missing redirectUri', { status: 400 });
  }

  const logoutUrl = buildLogoutUrl(redirectUri, cookies.get(ID_TOKEN_COOKIE)?.value);

  return new Response('', {
    status: 302,
    headers: {
      Location: logoutUrl,
    },
  });
};
