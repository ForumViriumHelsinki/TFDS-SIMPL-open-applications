import type {
  GetResourceAddressTemplatesParams,
  GetResourceAddressSchemaParams,
  GetResourceAddressUiSchemaParams,
  ResourceAddressTemplatesResponse,
  ResourceAddressSchemaResponse,
  ResourceAddressUiSchemaResponse,
} from '@simpl/vue-components';
import { fetchLocalEndpoint } from '@/util/services';
import type { SSelectOptions } from '@simpl/vue-components';

export function useResourceAddress() {
  const getResourceAddressTemplates = (params: GetResourceAddressTemplatesParams) =>
    fetchLocalEndpoint<SSelectOptions, ResourceAddressTemplatesResponse>(
      `/api/resourceAddress/sharingMethods/${params.sharingMethodId}/templates?offeringType=${params.offeringType}`,
      {
        method: 'GET',
        errorIdentifier: 'RESOURCE_ADDRESS_TEMPLATES_ERROR',
        apiName: 'resource address',
      },
      (data) =>
        data.map((template) => ({
          label: template.label,
          value: template.id,
        }))
    );

  const getResourceAddressSchema = (params: GetResourceAddressSchemaParams) =>
    fetchLocalEndpoint<ResourceAddressSchemaResponse>(
      `/api/resourceAddresses/templates/${params.templateId}/schema`,
      {
        method: 'GET',
        errorIdentifier: 'RESOURCE_ADDRESS_SCHEMA_ERROR',
        apiName: 'resource address schema',
      }
    );

  const getResourceAddressUiSchema = (params: GetResourceAddressUiSchemaParams) =>
    fetchLocalEndpoint<ResourceAddressUiSchemaResponse>(
      `/api/resourceAddresses/templates/${params.templateId}/uiSchema`,
      {
        method: 'GET',
        errorIdentifier: 'RESOURCE_ADDRESS_UI_SCHEMA_ERROR',
        apiName: 'resource address ui schema',
      }
    );

  return {
    getResourceAddressTemplates,
    getResourceAddressSchema,
    getResourceAddressUiSchema,
  };
}
