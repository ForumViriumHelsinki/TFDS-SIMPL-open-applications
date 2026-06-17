import { fetchTokenClientSide, setAuthorizationHeader } from '@/util/authentication';
import { getPublicEnv } from '@/util/getEnv';
import { enhancedFetch } from '@/util/fetch';
import type { SharingMethodId } from 'types/resourceAddress';
import type {
  GetResourceAddressTemplatesParams,
  GetResourceAddressSchemaParams,
  GetResourceAddressUiSchemaParams,
} from '@simpl/vue-components';

const getBaseUrl = (): string => {
  const { PUBLIC_CONTRACT_CONSUMPTION_API_URL, PUBLIC_CONTRACT_CONSUMPTION_API_VERSION } =
    getPublicEnv();

  if (PUBLIC_CONTRACT_CONSUMPTION_API_VERSION) {
    return `${PUBLIC_CONTRACT_CONSUMPTION_API_URL}/${PUBLIC_CONTRACT_CONSUMPTION_API_VERSION}`;
  }

  return PUBLIC_CONTRACT_CONSUMPTION_API_URL;
};

export const getEndpoint = (
  endpointName: string,
  params?: Record<string, string | SharingMethodId>
): string => {
  const baseUrl = getBaseUrl();

  const endpoints = {
    templates: `${baseUrl}/resourceAddresses/sharingMethods/${params?.sharingMethodId}/templates`,
    schema: `${baseUrl}/resourceAddresses/templates/${params?.templateId}/schema`,
    uiSchema: `${baseUrl}/resourceAddresses/templates/${params?.templateId}/uiSchema`,
  };

  return endpoints[endpointName as keyof typeof endpoints] || '';
};

export const getDestinationAddressTemplates = async (
  params: GetResourceAddressTemplatesParams,
  keycloakToken?: string
) => {
  keycloakToken = await fetchTokenClientSide(keycloakToken);

  const headers = new Headers({});
  setAuthorizationHeader(keycloakToken, headers);

  const url = new URL(
    getEndpoint('templates', { sharingMethodId: params.sharingMethodId as SharingMethodId })
  );
  url.searchParams.append('offeringType', params.offeringType.toLocaleUpperCase());

  return enhancedFetch(url.toString(), {
    method: 'GET',
    headers,
  });
};

export const getDestinationAddressSchema = async (
  params: GetResourceAddressSchemaParams,
  keycloakToken?: string
) => {
  keycloakToken = await fetchTokenClientSide(keycloakToken);

  const headers = new Headers({});
  setAuthorizationHeader(keycloakToken, headers);

  const url = getEndpoint('schema', { templateId: params.templateId });

  return enhancedFetch(url, {
    method: 'GET',
    headers,
  });
};

export const getDestinationAddressUiSchema = async (
  params: GetResourceAddressUiSchemaParams,
  keycloakToken?: string
) => {
  keycloakToken = await fetchTokenClientSide(keycloakToken);

  const headers = new Headers({});
  setAuthorizationHeader(keycloakToken, headers);

  const url = getEndpoint('uiSchema', { templateId: params.templateId });

  return enhancedFetch(url, {
    method: 'GET',
    headers,
  });
};
