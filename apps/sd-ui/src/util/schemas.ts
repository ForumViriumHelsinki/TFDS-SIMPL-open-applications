import type { SSelectOptions } from '@simpl/vue-components';
import type { SchemasResponse } from '@/types/schemas';

export const filterSchemas = (schemasResponse: SchemasResponse): SSelectOptions => {
  if (!schemasResponse.schemas || !Array.isArray(schemasResponse.schemas)) {
    return [];
  }
  return schemasResponse.schemas.map((schema) => ({
    label: schema.resourceType,
    value: schema.id,
  }));
};
