import { enhancedFetch } from '@/util/fetch';
import { getPublicEnv } from '@/util/getEnv';

const { PUBLIC_SIGNER_URL } = getPublicEnv();

export const signJson = async (json: object, keycloakToken: string): Promise<Response> => {
  const response = await enhancedFetch(`${PUBLIC_SIGNER_URL}/v1/credential`, {
    method: 'POST',
    body: JSON.stringify({
      context: ['https://w3id.org/security/suites/jws-2020/v1'],
      credentialSubject: json,
      issuer: 'did:web:did.dev.simpl-europa.eu',
      key: 'gaia-x-key1',
      namespace: 'transit',
      group: 'simpl',
    }),
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${keycloakToken}`,
    },
  });

  return response;
};
