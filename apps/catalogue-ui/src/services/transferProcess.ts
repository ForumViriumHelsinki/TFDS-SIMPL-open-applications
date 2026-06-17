import { fetchTokenClientSide, setAuthorizationHeader } from '@/util/authentication';
import { getPublicEnv } from '@/util/getEnv';
import { enhancedFetch } from '@/util/fetch';
import type { EdcTransferRequestData } from 'types/contracts';

export const getEndpoint = (endpointName: 'start' | 'status'): string => {
  const { PUBLIC_CONTRACT_CONSUMPTION_API_URL, PUBLIC_CONTRACT_CONSUMPTION_API_VERSION } =
    getPublicEnv();

  const endpoints = {
    start: `${PUBLIC_CONTRACT_CONSUMPTION_API_URL}/${PUBLIC_CONTRACT_CONSUMPTION_API_VERSION}/transfers`,
    status: `${PUBLIC_CONTRACT_CONSUMPTION_API_URL}/${PUBLIC_CONTRACT_CONSUMPTION_API_VERSION}/transfers`,
  };

  return endpoints[endpointName] || '';
};

export const startTransferProcess = async (
  transferRequest: EdcTransferRequestData,
  keycloakToken?: string
) => {
  keycloakToken = await fetchTokenClientSide(keycloakToken);

  const headers = new Headers({
    'Content-Type': 'application/json',
  });
  setAuthorizationHeader(keycloakToken, headers);

  return enhancedFetch(getEndpoint('start'), {
    method: 'POST',
    headers,
    body: JSON.stringify(transferRequest),
  });
};

export const getTransferProcessStatus = async (
  transferProcessId: string,
  keycloakToken?: string
) => {
  keycloakToken = await fetchTokenClientSide(keycloakToken);

  const headers = new Headers({});
  setAuthorizationHeader(keycloakToken, headers);

  return enhancedFetch(`${getEndpoint('status')}/${transferProcessId}`, {
    method: 'GET',
    headers,
  });
};
