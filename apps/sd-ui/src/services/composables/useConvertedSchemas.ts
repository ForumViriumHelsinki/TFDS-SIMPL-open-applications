import type { ConvertedSchema } from '@/types/shapes';
import { fetchLocalEndpoint } from '@/util/services';

const providerDataAddressProperty = {
  title: 'Provider data address',
  type: 'string',
  rdfType: 'xsd:string',
  description: 'Provider Data address',
};

function patchAssetProperties(obj: Record<string, any>): void {
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      if (value.rdfType === 'simpl:AssetProperties') {
        obj[key] = {
          type: 'object',
          properties: {
            'simpl:providerDataAddress': providerDataAddressProperty,
          },
          child: true,
          rdfType: 'simpl:AssetProperties',
          required: ['simpl:providerDataAddress'],
          title: 'Asset properties',
          description: 'Basic classification of the service as per provision type and service model.',
        };
      } else {
        patchAssetProperties(value);
      }
    }
  }
}

function transformConvertedSchema(schema: ConvertedSchema): ConvertedSchema {
  if (schema.root) {
    patchAssetProperties(schema.root as Record<string, any>);
  }
  return schema;
}

export function useConvertedSchemas(schemaId: string) {
  return fetchLocalEndpoint<ConvertedSchema>(
    `/api/schemas/${schemaId}/content?schemaUIType=sdCreation`,
    {
      method: 'GET',
      errorIdentifier: 'TTL_CONVERT_ERROR',
      apiName: 'catalogue UI ttl to json',
    },
    transformConvertedSchema
  );
}

export function useVersionedConvertedSchemas(schemaId: string, version: string) {
  return fetchLocalEndpoint<ConvertedSchema>(
    `/api/schemas/${schemaId}/${version}/content?schemaUIType=sdCreation`,
    {
      method: 'GET',
      errorIdentifier: 'TTL_CONVERT_ERROR',
      apiName: 'catalogue UI ttl to json',
    },
    transformConvertedSchema
  );
}
