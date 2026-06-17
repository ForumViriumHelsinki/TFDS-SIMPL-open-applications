import { buildLogoutUrl } from '@/services/keycloak';
import { describe, it, expect, vi, beforeAll } from 'vitest';

vi.mock('@/util/getEnv', () => ({
  getPublicEnv: vi.fn(() => ({
    PUBLIC_AUTH_KEYCLOAK_SERVER_URL: 'http://keycloak',
    PUBLIC_AUTH_KEYCLOAK_CLIENT_ID: 'clientId',
    PUBLIC_AUTH_KEYCLOAK_REALM: 'realm',
  })),
}));

describe('keycloak utilities', () => {
  it('builds the logout URL correctly', () => {
    const keycloakBaseUrl = 'http://redirecthere.com';
    const id_token_hint = 'idTokenHint';
    const logoutUrl = buildLogoutUrl(keycloakBaseUrl, id_token_hint);

    expect(logoutUrl).toBe(
      'http://keycloak/auth/realms/realm/protocol/openid-connect/logout?client_id=clientId&id_token_hint=idTokenHint&post_logout_redirect_uri=http%3A%2F%2Fredirecthere.com%2F%3Flogout_delete_cookies%3Dtrue'
    );
  });

  it('fails to build logout URL with missing parameters', () => {
    const keycloakBaseUrl = '';
    const id_token_hint = '';
    expect(buildLogoutUrl(keycloakBaseUrl, id_token_hint)).toBe('');
  });
});
