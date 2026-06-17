import type { JSONSchema4 } from 'json-schema';

export type RDFJsonSchema = JSONSchema4 & {
  rdfType: string;
};

export type SimplSDSchemaUIVariant = 'default' | 'sdCreation' | 'advancedSearch';

export type SimplConfigurePropertyValue =
  | 'hiddenInFrontend'
  | 'useForAdvancedSearch'
  | 'requiredOnFrontendOnly';

export const isValidSimplSDSchemaUIVariant = (
  value: string | undefined | null
): value is SimplSDSchemaUIVariant => {
  return !!value && ['default', 'sdCreation', 'advancedSearch'].includes(value);
};
