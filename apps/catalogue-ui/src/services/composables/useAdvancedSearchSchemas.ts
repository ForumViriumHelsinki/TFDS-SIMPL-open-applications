import { filterAdvancedSearchSchemas } from '@/util/search';
import { fetchLocalEndpoint } from '@/util/services';
import type { SSelectOptions } from '@simpl/vue-components';
import type { SearchSchemasCategorized } from 'types/searchApi';
import type { ConvertedSchema } from 'types/shapes';

export function useAdvancedSearchSchemas() {
  const fetchSearchSchemas = () =>
    fetchLocalEndpoint<SSelectOptions, SearchSchemasCategorized, SSelectOptions>(
      '/api/schemas',
      {
        method: 'GET',
        errorIdentifier: 'SCHEMA_FETCH_ERROR',
        apiName: 'xsfc advanced search be',
        defaultData: [],
      },
      filterAdvancedSearchSchemas
    );

  const fetchConvertedSchema = (schemaFileName: string) =>
    fetchLocalEndpoint<ConvertedSchema>(
      `/api/schemas/${schemaFileName}/content?schemaUIType=advancedSearch`,
      {
        method: 'GET',
        errorIdentifier: 'TTL_CONVERT_ERROR',
        apiName: 'catalogue UI ttl to json',
      }
    );

  return { fetchSearchSchemas, fetchConvertedSchema };
}
