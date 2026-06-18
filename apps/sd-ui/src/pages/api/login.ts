import { createLoginURL } from '@/services/keycloak';
import { setNewPkceCodeVerifier } from '@/util/authentication';
import { getPublicEnv } from '@/util/getEnv';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async (ctx) => {
  const pkceCodeVerifier = setNewPkceCodeVerifier(ctx);

  const env = getPublicEnv();
  const baseUrl = env.PUBLIC_BASE_URL || new URL(ctx.request.url).origin;

  let redirectUri = new URL(ctx.request.url).searchParams.get('redirect_uri') ?? baseUrl;
  
  if (redirectUri.startsWith('http://localhost') || redirectUri.startsWith('https://localhost')) {
    redirectUri = redirectUri.replace(/^https?:\/\/localhost(:\d+)?/, baseUrl);
  }

  const loginUrl = await createLoginURL(redirectUri, pkceCodeVerifier);

  return new Response(loginUrl, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    },
  });
};
