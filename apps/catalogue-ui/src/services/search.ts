import { fetchTokenClientSide, setAuthorizationHeader } from '@/util/authentication';
import { getPublicEnv } from '@/util/getEnv';
import { enhancedFetch } from '@/util/fetch';

const getVersionPrefix = () => {
  const { PUBLIC_SEARCH_API_VERSION } = getPublicEnv();
  return PUBLIC_SEARCH_API_VERSION ? `${PUBLIC_SEARCH_API_VERSION}` : 'v1';
};

export const getBaseUrl = (version?: string): string => {
  const { PUBLIC_SEARCH_API_URL } = getPublicEnv();
  const versionPrefix = getVersionPrefix();
  return `${PUBLIC_SEARCH_API_URL}/${version ?? versionPrefix}`;
};

export const getEndpoint = (
  endpointName: 'quickSearch' | 'advancedSearch' | 'selfDescription'
): string => {
  const {
    PUBLIC_FEDERATED_CATALOGUE_API_URL,
    PUBLIC_QUERY_MAPPER_ADAPTER_API_URL,
    PUBLIC_QUERY_MAPPER_ADAPTER_API_VERSION,
  } = getPublicEnv();

  const endpoints = {
    quickSearch: `${getBaseUrl('v1')}/selfDescriptions`,
    advancedSearch: `${getBaseUrl('v1')}/selfDescriptions/advanced`,
    selfDescription: `${getBaseUrl('v1')}/selfDescriptions`,
  };

  if (PUBLIC_FEDERATED_CATALOGUE_API_URL) {
    endpoints.selfDescription = `${PUBLIC_FEDERATED_CATALOGUE_API_URL}/self-descriptions`;
  }

  if (PUBLIC_QUERY_MAPPER_ADAPTER_API_URL) {
    endpoints.quickSearch = `${PUBLIC_QUERY_MAPPER_ADAPTER_API_URL}/${PUBLIC_QUERY_MAPPER_ADAPTER_API_VERSION}/selfDescriptions`;
    endpoints.advancedSearch = `${PUBLIC_QUERY_MAPPER_ADAPTER_API_URL}/${PUBLIC_QUERY_MAPPER_ADAPTER_API_VERSION}/selfDescriptions/advancedSearch`;
  }

  return endpoints[endpointName] || '';
};

export const fetchQuickSearchResponse = async (text: string | null, keycloakToken?: string) => {
  const { PUBLIC_QUERY_MAPPER_ADAPTER_API_URL } = getPublicEnv();

  keycloakToken = await fetchTokenClientSide(keycloakToken);

  const searchTerms = text ? text.split(' ').join(',') : '';

  const headers = new Headers();
  setAuthorizationHeader(keycloakToken, headers);

  const endpointUrl = getEndpoint('quickSearch');

  let parameterName = 'q';
  if (PUBLIC_QUERY_MAPPER_ADAPTER_API_URL) {
    parameterName = 'searchString';
  }

  return enhancedFetch(`${endpointUrl}?${parameterName}=${encodeURIComponent(searchTerms)}`, {
    method: 'GET',
    headers,
  });
};

export const fetchAdvancedSearchResponse = async (
  searchData: object,
  keycloakToken?: string
): Promise<Response> => {
  keycloakToken = await fetchTokenClientSide(keycloakToken);

  const headers = new Headers({ 'Content-Type': 'application/json' });
  setAuthorizationHeader(keycloakToken, headers);

  return enhancedFetch(getEndpoint('advancedSearch'), {
    method: 'POST',
    headers,
    body: JSON.stringify(searchData),
  });
};

export const getSelfDescriptionById = async (
  id: string,
  keycloakToken?: string
): Promise<Response> => {
  const requestUrl = `${getEndpoint('selfDescription')}/${id}`;

  const headers = new Headers();

  keycloakToken = await fetchTokenClientSide(keycloakToken);
  setAuthorizationHeader(keycloakToken, headers);

  return enhancedFetch(requestUrl, {
    method: 'GET',
    headers,
  });
};
