import type { Quad } from '@rdfjs/types';
import type { SimplSDSchemaUIVariant } from '@/types/ttlParser';

export const toCompactURI = (uri: string, prefixes: Record<string, string>) => {
  for (const [prefix, namespace] of Object.entries(prefixes)) {
    if (uri.startsWith(namespace)) {
      const localName = uri.slice(namespace.length);
      if (localName && !localName.includes('/') && !localName.includes('#')) {
        return `${prefix}:${localName}`;
      }
    }
  }
  return uri;
};

export const getShapePropertyNameWithoutPath = (shapeQuad: Quad) => {
  return shapeQuad.subject.value.split('#').pop();
};

export const isValidSimplSDSchemaUIVariant = (
  value: string | null | undefined
): value is SimplSDSchemaUIVariant => {
  return !!value && ['default', 'sdCreation', 'advancedSearch'].includes(value);
};
