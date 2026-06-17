import { fetchTokenClientSide, setAuthorizationHeader } from '@/util/authentication';
import { getPublicEnv } from '@/util/getEnv';
import { enhancedFetch } from '@/util/fetch';
import type { ContractNegotiationRequestData } from 'types/contracts';

export const getEndpoint = (endpointName: 'negotiate' | 'offers' | 'status'): string => {
  const { PUBLIC_CONTRACT_CONSUMPTION_API_URL, PUBLIC_CONTRACT_CONSUMPTION_API_VERSION } =
    getPublicEnv();

  const endpoints = {
    negotiate: `${PUBLIC_CONTRACT_CONSUMPTION_API_URL}/${PUBLIC_CONTRACT_CONSUMPTION_API_VERSION}/contracts`,
    offers: `${PUBLIC_CONTRACT_CONSUMPTION_API_URL}/${PUBLIC_CONTRACT_CONSUMPTION_API_VERSION}/connectorCatalog/assets`,
    status: `${PUBLIC_CONTRACT_CONSUMPTION_API_URL}/${PUBLIC_CONTRACT_CONSUMPTION_API_VERSION}/contracts`,
  };

  return endpoints[endpointName] || '';
};

export const getCatalogueOffers = async (
  contractNegotiationRequestData: ContractNegotiationRequestData,
  keycloakToken?: string
) => {
  keycloakToken = await fetchTokenClientSide(keycloakToken);

  const headers = new Headers({
    'Content-Type': 'application/json',
  });
  setAuthorizationHeader(keycloakToken, headers);

  return enhancedFetch(getEndpoint('offers'), {
    method: 'POST',
    headers,
    body: JSON.stringify(contractNegotiationRequestData),
  });
};

export const initiateContractNegotiation = async (
  contractNegotiationRequestData: ContractNegotiationRequestData,
  keycloakToken?: string
) => {
  keycloakToken = await fetchTokenClientSide(keycloakToken);

  const headers = new Headers({
    'Content-Type': 'application/json',
  });
  setAuthorizationHeader(keycloakToken, headers);

  return enhancedFetch(getEndpoint('negotiate'), {
    method: 'POST',
    headers,
    body: JSON.stringify(contractNegotiationRequestData),
  });
};

export const getContractNegotiationStatus = async (
  negotiationId: string,
  keycloakToken?: string
) => {
  keycloakToken = await fetchTokenClientSide(keycloakToken);

  const headers = new Headers({});
  setAuthorizationHeader(keycloakToken, headers);

  return enhancedFetch(`${getEndpoint('status')}/${negotiationId}`, {
    method: 'GET',
    headers,
  });
};
