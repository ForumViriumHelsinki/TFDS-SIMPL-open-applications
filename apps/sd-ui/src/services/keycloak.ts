import {
  LOGOUT_DELETE_COOKIES_QUERY_PARAM,
  pkceChallengeFromVerifier,
  stripOauthParamsFromUrl,
} from '@/util/authentication';
import { getPublicEnv } from '@/util/getEnv';
import type { KeycloakError, KeycloakResponse } from '@/types/authentication';

const {
  PUBLIC_AUTH_KEYCLOAK_SERVER_URL: keycloakServer,
  PUBLIC_AUTH_KEYCLOAK_CLIENT_ID: clientId,
  PUBLIC_AUTH_KEYCLOAK_REALM: realm,
} = getPublicEnv();

const keycloakBaseUrl = `${keycloakServer}/auth/realms/${realm}/protocol/openid-connect`;

export const isKeycloakError = (data: KeycloakResponse): data is KeycloakError =>
  (data as KeycloakError).error !== undefined;

export const isAuthenticationEnabled = () =>
  keycloakServer?.length > 0 && clientId?.length > 0 && realm?.length > 0;

export const createLoginURL = async (redirectUri: string, pkceCodeVerifier: string) => {
  const url = new URL(`${keycloakBaseUrl}/auth`);
  redirectUri = stripOauthParamsFromUrl(redirectUri);

  url.searchParams.append('client_id', clientId);
  url.searchParams.append('response_type', 'code');
  url.searchParams.append('redirect_uri', redirectUri);
  url.searchParams.append('scope', 'openid');
  url.searchParams.append('code_challenge_method', 'S256');
  url.searchParams.append('code_challenge', await pkceChallengeFromVerifier(pkceCodeVerifier));

  return url.toString();
};

export const getAccessToken = async (
  code: string,
  pkceCodeVerifier: string,
  redirectUri: string
) => {
  const url = new URL(`${keycloakBaseUrl}/token`);
  redirectUri = stripOauthParamsFromUrl(redirectUri);

  const body = new URLSearchParams();
  body.append('grant_type', 'authorization_code');
  body.append('client_id', clientId);
  body.append('code', code);
  body.append('redirect_uri', redirectUri);
  body.append('code_verifier', pkceCodeVerifier);

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  const data = (await response.json()) as KeycloakResponse;
  return data;
};

export const refreshAccessToken = async (
  refreshToken: string,
  pkceCodeVerifier: string,
  redirectUri: string
) => {
  const url = new URL(`${keycloakBaseUrl}/token`);
  redirectUri = stripOauthParamsFromUrl(redirectUri);

  const body = new URLSearchParams();
  body.append('grant_type', 'refresh_token');
  body.append('client_id', clientId);
  body.append('refresh_token', refreshToken);
  body.append('code_verifier', pkceCodeVerifier);
  body.append('redirect_uri', redirectUri);

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  const data = (await response.json()) as KeycloakResponse;
  return data;
};

export const buildLogoutUrl = (redirectUri: string, id_token_hint?: string) => {
  if (!id_token_hint) return '';
  const redirectUrl = new URL(redirectUri);
  redirectUrl.searchParams.append(LOGOUT_DELETE_COOKIES_QUERY_PARAM, 'true');

  const logoutUrl = new URL(`${keycloakBaseUrl}/logout`);
  logoutUrl.searchParams.append('client_id', clientId);
  logoutUrl.searchParams.append('id_token_hint', id_token_hint);
  logoutUrl.searchParams.append('post_logout_redirect_uri', redirectUrl.toString());

  return logoutUrl.toString();
};
