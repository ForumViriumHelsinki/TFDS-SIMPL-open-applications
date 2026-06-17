import type { AccessPoliciesDTO, UsagePoliciesDTO } from '@/types/accessPolicy';
import { getPublicEnv } from '@/util/getEnv';
import { enhancedFetch } from '@/util/fetch';

const { PUBLIC_CREATION_WIZARD_API_URL, PUBLIC_CREATION_WIZARD_API_VERSION } = getPublicEnv();

const getVersionPrefix = () => {
  return PUBLIC_CREATION_WIZARD_API_VERSION ? `${PUBLIC_CREATION_WIZARD_API_VERSION}` : 'api';
};

export const getBaseUrl = (version?: string): string => {
  const versionPrefix = getVersionPrefix();
  return `${PUBLIC_CREATION_WIZARD_API_URL}/${version ?? versionPrefix}`;
};

const getEndpoint = (endpointName: string, params?: Record<string, string>): string => {
  const baseUrl = getBaseUrl();

  const endpoints = {
    publishSelfDescription: `${getBaseUrl('v1')}/selfDescriptions/publications`,
    finalizedSelfDescription: `${getBaseUrl('v1')}/selfDescriptions/finalized?schemaId=${params?.schema}`,
    enrichAndValidateSchema: `${getBaseUrl('v3')}/selfDescriptions/enriched?schemaId=${params?.schema}`,
    usagePolicy: `${getBaseUrl('v1')}/policies/usage`,
    accessPolicy: `${getBaseUrl('v1')}/policies/access`,
    identityAttributes: `${getBaseUrl('v1')}/policies/identityAttributes`,
    accessPolicyActions: `${getBaseUrl('v1')}/policies/actions`,
    schemas: `${baseUrl}/schemas`,
    schemaData: `${baseUrl}/schemas/${params?.schema}/content`,
    versionedSchemaData: `${baseUrl}/schemas/${params?.schema}/${params?.version}`,
    resourceAddressTemplateUiSchema: `${getBaseUrl('v1')}/resourceAddresses/templates/${params?.templateId}/uiSchema`,
    resourceAddressTemplateSchema: `${getBaseUrl('v1')}/resourceAddresses/templates/${params?.templateId}/schema`,
    resourceAddressSharingMethods: `${getBaseUrl('v1')}/resourceAddresses/sharingMethods?offeringType=${params?.offeringType}`,
    resourceAddressTemplates: `${getBaseUrl('v1')}/resourceAddresses/sharingMethods/${params?.sharingMethodId}/templates?offeringType=${params?.offeringType}`,
    resourceDescriptions: `${getBaseUrl('v1')}/resourceDescriptions?orderBy=${params?.orderBy}`,
    resourceDescriptionDetails: `${getBaseUrl('v1')}/resourceDescriptions/${params?.resourceDescriptionId}`,
    resourceDescriptionVersions: `${getBaseUrl('v1')}/resourceDescriptions/${params?.resourceDescriptionId}/versions?page=${params?.page ?? '1'}&pageSize=${params?.pageSize ?? '10'}`,
    resourceAddressByAssetId: `${getBaseUrl('v1')}/resourceAddresses/assets/${params?.assetId}`,
  };

  return endpoints[endpointName as keyof typeof endpoints] || '';
};

export const getSchemas = async (keycloakToken?: string): Promise<Response> => {
  const response = await enhancedFetch(getEndpoint('schemas'), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${keycloakToken}`,
    },
  });
  return response;
};

export const fetchSchemaData = async (
  schema: string,
  keycloakToken?: string
): Promise<Response> => {
  const response = await enhancedFetch(getEndpoint('schemaData', { schema }), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${keycloakToken}`,
    },
  });
  return response;
};

export const fetchVersionedSchemaData = async (
  schema: string,
  version: string,
  keycloakToken?: string
): Promise<Response> => {
  const response = await enhancedFetch(getEndpoint('versionedSchemaData', { schema, version }), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${keycloakToken}`,
      Accept: 'text/turtle, application/problem+json',
    },
  });
  return response;
};

export const getAccessPolicyActions = async (keycloakToken?: string): Promise<Response> => {
  const response = await enhancedFetch(getEndpoint('accessPolicyActions'), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${keycloakToken}`,
      Accept: 'application/json',
      'Cache-Control': 'public, max-age=604800',
    },
  });
  return response;
};

export const getIdentityAttributes = async (keycloakToken?: string): Promise<Response> => {
  const response = await enhancedFetch(getEndpoint('identityAttributes'), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${keycloakToken}`,
      Accept: 'application/json',
      'Cache-Control': 'public, max-age=604800',
    },
  });
  return response;
};

export const getAccessPolicyJsonLd = async (
  accessPolicies: AccessPoliciesDTO,
  keycloakToken?: string
): Promise<Response> => {
  const response = await enhancedFetch(getEndpoint('accessPolicy'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${keycloakToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(accessPolicies),
  });
  return response;
};

export const getUsagePolicyJsonLd = async (
  usagePolicies: UsagePoliciesDTO,
  keycloakToken?: string
): Promise<Response> => {
  const response = await enhancedFetch(getEndpoint('usagePolicy'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${keycloakToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(usagePolicies),
  });
  return response;
};

const enrichmentV3DataTransformation = (data: object, templateId: string) => {
  let value =
    (data as Record<string, any>)?.['simpl:assetProperties']?.['simpl:providerDataAddress'] ?? '';
  delete (data as Record<string, any>)?.['simpl:assetProperties']?.['simpl:providerDataAddress'];
  return {
    sdJson: data,
    properties: {
      resourceAddress: {
        value: value,
        templateId: templateId,
      },
    },
  };
};

export const finalizeSelfDescription = async (
  schema: string,
  templateId: string,
  data: object,
  keycloakToken?: string
): Promise<Response> => {
  const body = JSON.stringify(enrichmentV3DataTransformation(data, templateId));

  const response = await enhancedFetch(getEndpoint('finalizedSelfDescription', { schema }), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${keycloakToken}`,
      Accept: 'application/json, application/problem+json',
      'Content-Type': 'application/json',
    },
    body,
  });
  return response;
};

export const enrichAndValidateSchema = async (
  schema: string,
  templateId: string,
  data: object,
  keycloakToken?: string
): Promise<Response> => {
  const body = JSON.stringify(enrichmentV3DataTransformation(data, templateId));

  const response = await enhancedFetch(getEndpoint('enrichAndValidateSchema', { schema }), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${keycloakToken}`,
      Accept: 'application/json, application/problem+json',
      'Content-Type': 'application/json',
    },
    body,
  });
  return response;
};

export const publishSelfDescriptionToCatalogue = async (
  selfDescription: object,
  keycloakToken?: string
): Promise<Response> => {
  const body = JSON.stringify(selfDescription);
  const response = await enhancedFetch(getEndpoint('publishSelfDescription'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${keycloakToken}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body,
  });
  return response;
};

export const getResourceAddressTemplateUiSchema = async (
  templateId: string,
  keycloakToken?: string
): Promise<Response> => {
  const response = await enhancedFetch(
    getEndpoint('resourceAddressTemplateUiSchema', { templateId }),
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${keycloakToken}`,
        Accept: 'application/json',
      },
    }
  );
  return response;
};

export const getResourceAddressTemplateSchema = async (
  templateId: string,
  keycloakToken?: string
): Promise<Response> => {
  const response = await enhancedFetch(
    getEndpoint('resourceAddressTemplateSchema', { templateId }),
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${keycloakToken}`,
        Accept: 'application/json',
      },
    }
  );
  return response;
};

export const getResourceAddressSharingMethods = async (
  offeringType: string,
  keycloakToken?: string
): Promise<Response> => {
  const response = await enhancedFetch(
    getEndpoint('resourceAddressSharingMethods', { offeringType }),
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${keycloakToken}`,
        Accept: 'application/json',
      },
    }
  );
  return response;
};

export const getResourceAddressTemplates = async (
  sharingMethodId: string,
  offeringType: string,
  keycloakToken?: string
): Promise<Response> => {
  const response = await enhancedFetch(
    getEndpoint('resourceAddressTemplates', { sharingMethodId, offeringType }),
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${keycloakToken}`,
        Accept: 'application/json',
      },
    }
  );
  return response;
};

export const getResourceDescriptions = async (
  keycloakToken?: string,
  orderBy: 'publicationDate' | 'resourceType' = 'publicationDate'
): Promise<Response> => {
  const response = await enhancedFetch(getEndpoint('resourceDescriptions', { orderBy }), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${keycloakToken}`,
      Accept: 'application/json',
    },
  });
  return response;
};

export const getResourceDescriptionDetails = async (
  resourceDescriptionId: string,
  keycloakToken?: string
): Promise<Response> => {
  const response = await enhancedFetch(
    getEndpoint('resourceDescriptionDetails', { resourceDescriptionId }),
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${keycloakToken}`,
        Accept: 'application/json',
      },
    }
  );
  return response;
};

export const getResourceAddressByAssetId = async (
  assetId: string,
  keycloakToken?: string
): Promise<Response> => {
  const response = await enhancedFetch(getEndpoint('resourceAddressByAssetId', { assetId }), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${keycloakToken}`,
      Accept: 'application/json',
    },
  });
  return response;
};

export const getResourceDescriptionVersions = async (
  resourceDescriptionId: string,
  page: number = 1,
  pageSize: number = 10,
  keycloakToken?: string
): Promise<Response> => {
  const response = await enhancedFetch(
    getEndpoint('resourceDescriptionVersions', {
      resourceDescriptionId,
      page: String(page),
      pageSize: String(pageSize),
    }),
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${keycloakToken}`,
        Accept: 'application/json',
      },
    }
  );
  return response;
};

export const revokeResourceDescription = async (
  resourceDescriptionId: string,
  keycloakToken?: string
): Promise<Response> => {
  const response = await enhancedFetch(
    `${getEndpoint('resourceDescriptionDetails', { resourceDescriptionId })}/revoke`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${keycloakToken}`,
        Accept: 'application/json',
      },
    }
  );
  return response;
};
