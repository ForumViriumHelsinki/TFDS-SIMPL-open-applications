import { createLoginURL } from '@/services/keycloak';
import { generateRandomString } from '@/util/authentication';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request, cookies }) => {
  const pkceCodeVerifier = generateRandomString();
  cookies.set('pkceCodeVerifier', pkceCodeVerifier);

  const redirectUri =
    new URL(request.url).searchParams.get('redirect_uri') ?? new URL(request.url).origin;

  const loginUrl = await createLoginURL(redirectUri, pkceCodeVerifier);

  return new Response(loginUrl, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    },
  });
};
