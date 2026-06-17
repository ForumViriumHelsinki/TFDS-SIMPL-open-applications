import { createLoginURL } from '@/services/keycloak';
import { setNewPkceCodeVerifier } from '@/util/authentication';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async (ctx) => {
  const pkceCodeVerifier = setNewPkceCodeVerifier(ctx);

  const redirectUri =
    new URL(ctx.request.url).searchParams.get('redirect_uri') ?? new URL(ctx.request.url).origin;

  const loginUrl = await createLoginURL(redirectUri, pkceCodeVerifier);

  return new Response(loginUrl, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    },
  });
};
