import { describe, it, expect } from 'vitest';
import { filterRootToOfferingShape } from '@/util/schema/filterRootShapes';

describe('filterRootToOfferingShape', () => {
  it('should return only the OfferingShape entry when one exists among multiple shapes', () => {
    const root = {
      ProviderInformationShape: { type: 'object' as const, properties: { a: { type: 'string' as const } } },
      DataOfferingShape: { type: 'object' as const, properties: { b: { type: 'string' as const } } },
      ContractTemplateShape: { type: 'object' as const, properties: { c: { type: 'string' as const } } },
    };

    const result = filterRootToOfferingShape(root);

    expect(Object.keys(result)).toEqual(['DataOfferingShape']);
    expect(result['DataOfferingShape']).toEqual(root['DataOfferingShape']);
  });

  it('should work with different OfferingShape prefixes (e.g. ServiceOfferingShape)', () => {
    const root = {
      SomeOtherShape: { type: 'object' as const },
      ServiceOfferingShape: { type: 'object' as const, properties: { x: { type: 'string' as const } } },
    };

    const result = filterRootToOfferingShape(root);

    expect(Object.keys(result)).toEqual(['ServiceOfferingShape']);
    expect(result['ServiceOfferingShape']).toEqual(root['ServiceOfferingShape']);
  });

  it('should return the full root when no OfferingShape entry exists', () => {
    const root = {
      ShapeA: { type: 'object' as const, properties: {} },
      ShapeB: { type: 'object' as const, properties: {} },
    };

    const result = filterRootToOfferingShape(root);

    expect(result).toBe(root);
  });

  it('should return the single entry when root has only one OfferingShape', () => {
    const root = {
      DataOfferingShape: { type: 'object' as const, properties: { a: { type: 'string' as const } } },
    };

    const result = filterRootToOfferingShape(root);

    expect(Object.keys(result)).toEqual(['DataOfferingShape']);
    expect(result['DataOfferingShape']).toEqual(root['DataOfferingShape']);
  });

  it('should return the first OfferingShape when multiple exist', () => {
    const root = {
      DataOfferingShape: { type: 'object' as const, properties: { a: { type: 'string' as const } } },
      ServiceOfferingShape: { type: 'object' as const, properties: { b: { type: 'string' as const } } },
    };

    const result = filterRootToOfferingShape(root);

    expect(Object.keys(result)).toEqual(['DataOfferingShape']);
  });

  it('should handle an empty root object', () => {
    const root = {};

    const result = filterRootToOfferingShape(root);

    expect(result).toEqual({});
  });
});
