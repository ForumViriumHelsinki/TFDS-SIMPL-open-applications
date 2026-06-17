import type { AccessPoliciesDTO, UsagePoliciesDTO } from '@/types/accessPolicy';
import type { ResourceDescriptionPublishResponse } from '@/types/resourceDescription';
import type { SchemasResponse } from '@/types/schemas';

const createJsonResponse = <T>(data: T, init?: ResponseInit): Response => {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    ...init,
  });
};

export const getBaseUrl = (version?: string): string => {
  return `mock://sdtooling/${version ?? 'api'}`;
};

export const getSchemas = async (): Promise<Response> => {
  const data: SchemasResponse = {
    schemas: [
      {
        id: 'mock-schema-1',
        title: 'Mock Service Offering',
        name: 'mock-service-offering',
        description: 'Mock schema for service offerings.',
        resourceType: 'service',
        version: '1.0.0',
      },
    ],
  };

  return createJsonResponse(data);
};

export const fetchSchemaData = async (schema: string): Promise<Response> => {
  const data = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: `mock://${schema}`,
    title: `Mock schema: ${schema}`,
    type: 'object',
    properties: {},
  };

  return createJsonResponse(data);
};

export const getAccessPolicyActions = async (): Promise<Response> => {
  const data = {
    actions: [
      {
        id: 'READ',
        label: 'Read',
      },
      {
        id: 'USE',
        label: 'Use',
      },
    ],
  };

  return createJsonResponse(data);
};

export const getIdentityAttributes = async (): Promise<Response> => {
  const data = [
    {
      identifier: 'email',
      code: 'EMAIL',
    },
    {
      identifier: 'organization',
      code: 'ORG',
    },
  ];

  return createJsonResponse(data);
};

export const getAccessPolicyJsonLd = async (
  accessPolicies: AccessPoliciesDTO
): Promise<Response> => {
  const permissions = accessPolicies.permissions.map((permission) => ({
    target: accessPolicies.resourceUri,
    assignee: permission.assignee,
    action: permission.action,
    fromDatetime: permission.fromDatetime,
    toDatetime: permission.toDatetime,
  }));

  const data = {
    '@context': 'https://www.w3.org/ns/odrl.jsonld',
    '@type': 'Agreement',
    '@id': `mock:${accessPolicies.resourceUri}`,
    permission: permissions,
  };

  return createJsonResponse(data);
};

export const getUsagePolicyJsonLd = async (usagePolicies: UsagePoliciesDTO): Promise<Response> => {
  const data = {
    '@context': 'https://www.w3.org/ns/odrl.jsonld',
    '@type': 'Agreement',
    '@id': `mock:${usagePolicies.resourceUri}`,
    permission: usagePolicies.permissions,
  };

  return createJsonResponse(data);
};

export const finalizeSelfDescription = async (
  schema: string,
  templateId: string,
  data: object
): Promise<Response> => {
  const response = {
    sdJson: data,
    properties: {
      resourceAddress: {
        templateId,
        value: '',
      },
    },
  };

  return createJsonResponse(response);
};

export const enrichAndValidateSchema = async (
  schema: string,
  templateId: string,
  data: object
): Promise<Response> => {
  const response = {
    schemaId: schema,
    templateId,
    enriched: data,
    valid: true,
  };

  return createJsonResponse(response);
};

export const publishSelfDescriptionToCatalogue = async (
  selfDescription: object
): Promise<Response> => {
  const now = new Date().toISOString();
  const data: ResourceDescriptionPublishResponse = {
    sdHash: 'mock-hash',
    id: 'mock-resource-id',
    status: 'PUBLISHED',
    issuer: 'mock-issuer',
    validatorDids: [],
    uploadDatetime: now,
    statusDatetime: now,
  };

  return createJsonResponse(data, { status: 201 });
};

export const getResourceAddressTemplateUiSchema = async (templateId: string): Promise<Response> => {
  const data = {
    templateId,
    uiSchema: {},
  };

  return createJsonResponse(data);
};

export const getResourceAddressTemplateSchema = async (templateId: string): Promise<Response> => {
  const data = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: `mock://resourceAddress/templates/${templateId}`,
    title: `Mock resource address template ${templateId}`,
    type: 'object',
    properties: {
      endpoint: {
        type: 'string',
      },
    },
  };

  return createJsonResponse(data);
};

export const getResourceAddressSharingMethods = async (offeringType: string): Promise<Response> => {
  const data = {
    offeringType,
    sharingMethods: [
      {
        id: 'http',
        label: 'HTTP',
        description: 'HTTP download.',
      },
    ],
  };

  return createJsonResponse(data);
};

export const getResourceAddressTemplates = async (
  sharingMethodId: string,
  offeringType: string
): Promise<Response> => {
  const data = {
    offeringType,
    sharingMethodId,
    templates: [
      {
        id: 'http-download',
        title: 'HTTP Download',
        description: 'Mock HTTP download template.',
        version: '1.0.0',
      },
    ],
  };

  return createJsonResponse(data);
};

export const getResourceDescriptions = async (
  _keycloakToken?: string,
  orderBy: 'publicationDate' | 'resourceType' = 'publicationDate'
): Promise<Response> => {
  const data = {
    orderBy,
    resourceDescriptions: [
      {
        id: 'mock-resource-1',
        title: 'Mock Resource Description',
        resourceType: 'service',
        publicationDate: new Date().toISOString(),
      },
    ],
  };

  return createJsonResponse(data);
};

export const getResourceDescriptionDetails = async (
  resourceDescriptionId: string
): Promise<Response> => {
  const data = {
    id: resourceDescriptionId,
    title: 'Mock Resource Description Details',
    resourceType: 'service',
    content: {},
  };

  return createJsonResponse(data);
};

export const getResourceAddressByAssetId = async (assetId: string): Promise<Response> => {
  const data = {
    templateId: 'mock-template-1',
    value: JSON.stringify({
      type: 'MinioS3',
      endpoint: 'https://minio.example.com',
      bucketName: 'mock-bucket',
      objectName: 'mock-object.txt',
    }),
  };

  return createJsonResponse(data);
};

export const getResourceDescriptionVersions = async (
  resourceDescriptionId: string
): Promise<Response> => {
  const data = {
    totalCount: 2,
    items: [
      {
        n: {
          claimsGraphUri: [resourceDescriptionId],
          offeringType: 'service',
          name: 'Mock Resource v2',
          description: 'Second version of the resource description.',
          version: '2',
        },
      },
      {
        n: {
          claimsGraphUri: [resourceDescriptionId],
          offeringType: 'service',
          name: 'Mock Resource v1',
          description: 'First version of the resource description.',
          version: '1',
        },
      },
    ],
  };

  return createJsonResponse(data);
};

export const revokeResourceDescription = async (
  _resourceDescriptionId: string
): Promise<Response> => {
  return new Response(null, { status: 200 });
};
