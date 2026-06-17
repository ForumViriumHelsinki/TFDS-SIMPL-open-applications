import type { SSelectOptions, AdvancedSearchNumberRangeValue } from '@simpl/vue-components';
import type {
  SearchAPIResult,
  RawSearchAPIResults,
  SearchSchemasCategorized,
  SearchAdvancedRequestBody,
} from 'types/searchApi';

export const transformSearchResultItems = (data: RawSearchAPIResults): SearchAPIResult[] =>
  data.items.map((item) => Object.values(item)[0]);

export const filterAdvancedSearchSchemas = (
  schemasResponse: SearchSchemasCategorized
): SSelectOptions => {
  return schemasResponse.Service?.map((schemaName) => ({
    label: schemaName.replace(/\.ttl/, ''),
    value: schemaName,
  })) || [];
};

export const transformFormDataToAdvancedSearchRequestBody = (
  formData: Record<string, Record<string, AdvancedSearchNumberRangeValue>>
): SearchAdvancedRequestBody | undefined => {
  if (!formData || Object.keys(formData).length === 0) {
    return undefined;
  }

  const body: SearchAdvancedRequestBody = {};

  for (const [key, value] of Object.entries(formData)) {
    for (const [innerKey, innerValue] of Object.entries(value)) {
      const newKey = innerKey.replace(/^[^:]*:/, '');
      const sectionKey =
        key.split(':')[0] +
        ':' +
        key.split(':')[1].slice(0, 1).toUpperCase() +
        key.split(':')[1].slice(1);

      body[sectionKey] = { ...body[sectionKey], '@type': key, [newKey]: innerValue };
    }
  }

  return body;
};
