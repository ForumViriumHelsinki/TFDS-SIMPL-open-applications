import type {
  GetResourceAddressTemplatesParams,
  GetResourceAddressSchemaParams,
  GetResourceAddressUiSchemaParams,
  ResourceAddressTemplatesResponse,
  ResourceAddressSchemaResponse,
  ResourceAddressUiSchemaResponse,
} from '@simpl/vue-components';

export const getDestinationAddressTemplates = async (
  params: GetResourceAddressTemplatesParams,
  keycloakToken?: string
): Promise<Response> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const mockTemplates: ResourceAddressTemplatesResponse = [
    {
      id: '1',
      label: 'HTTP Data Push Template 1',
    },
    {
      id: '2',
      label: 'HTTP Data Push Template 2',
    },
    {
      id: '3',
      label: 'S3 Bucket Template',
    },
  ];

  return new Response(JSON.stringify(mockTemplates), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const getDestinationAddressSchema = async (
  params: GetResourceAddressSchemaParams,
  keycloakToken?: string
): Promise<Response> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const mockSchema: ResourceAddressSchemaResponse = {
    type: 'object',
    properties: {
      bucketName: {
        type: 'string',
        description: 'Name of the S3 bucket',
      },
      acl: {
        type: 'string',
        description: 'Access control list setting',
        enum: ['private', 'public-read', 'public-read-write'],
      },
      region: {
        type: 'string',
        description: 'AWS region',
        enum: ['us-east-1', 'us-west-2', 'eu-west-1'],
      },
    },
    required: ['bucketName'],
  };

  return new Response(JSON.stringify(mockSchema), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const getDestinationAddressUiSchema = async (
  params: GetResourceAddressUiSchemaParams,
  keycloakToken?: string
): Promise<Response> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const mockUiSchema: ResourceAddressUiSchemaResponse = {
    'ui:order': ['bucketName', 'region', 'acl'],
    bucketName: {
      'ui:placeholder': 'Enter bucket name',
      'ui:help': 'The name must be globally unique across all AWS accounts',
    },
    acl: {
      'ui:widget': 'select',
      'ui:placeholder': 'Select access control level',
    },
    region: {
      'ui:widget': 'select',
      'ui:placeholder': 'Select AWS region',
    },
  };

  return new Response(JSON.stringify(mockUiSchema), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
