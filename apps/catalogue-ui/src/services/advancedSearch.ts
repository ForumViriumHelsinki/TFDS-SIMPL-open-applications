import { fetchTokenClientSide, setAuthorizationHeader } from '@/util/authentication';
import { enhancedFetch } from '@/util/fetch';
import { getBaseUrl } from './search';

export const getEndpoint = (
  endpointName: 'content' | 'schemas',
  params?: Record<string, string>
): string => {
  const endpoints = {
    schemas: `${getBaseUrl('v2')}/schemas`,
    content: `${getBaseUrl('v2')}/schemas/${params?.schemaId}/content`,
  };

  return endpoints[endpointName] || '';
};

export const getSchemas = async (keycloakToken?: string): Promise<Response> => {
  keycloakToken = await fetchTokenClientSide(keycloakToken);
  const headers = new Headers({});
  setAuthorizationHeader(keycloakToken, headers);

  return enhancedFetch(getEndpoint('schemas'), {
    method: 'GET',
    headers,
  });
};

export const fetchSchemaData = async (
  schema: string,
  keycloakToken?: string
): Promise<Response> => {
  keycloakToken = await fetchTokenClientSide(keycloakToken);

  const headers = new Headers();
  setAuthorizationHeader(keycloakToken, headers);

  const response = await enhancedFetch(getEndpoint('content', { schemaId: schema }), {
    method: 'GET',
    headers,
  });
  return response;
};
