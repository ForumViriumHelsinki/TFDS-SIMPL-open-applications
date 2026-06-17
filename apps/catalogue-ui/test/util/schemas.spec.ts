import { describe, it, expect } from 'vitest';
import { filterSchemas } from '@/util/schemas';
import type { SchemasResponse } from '@/types/schemas';

describe('filterSchemas', () => {
  it('should map schema metadata to label/value objects using title and id', () => {
    const input: SchemasResponse = {
      schemas: [
        {
          id: 'application-health',
          title: 'Application Asset',
          name: 'health',
          description: 'Schema for describing a software application.',
          resourceType: 'APPLICATION',
          version: '1.0.0',
        },
        {
          id: 'data-offeringShape',
          title: 'Data Offering',
          name: 'Data offering',
          description: 'SHACL shape for data offering self-descriptions.',
          resourceType: 'DATA',
          version: '1.0.0',
        },
      ],
    };

    const result = filterSchemas(input);

    expect(result).toEqual([
      { label: 'Application Asset', value: 'application-health' },
      { label: 'Data Offering', value: 'data-offeringShape' },
    ]);
  });

  it('should return empty array when schemas is empty', () => {
    const input: SchemasResponse = { schemas: [] };

    expect(filterSchemas(input)).toEqual([]);
  });

  it('should return empty array when schemas is missing', () => {
    const input = {} as SchemasResponse;

    expect(filterSchemas(input)).toEqual([]);
  });

  it('should return empty array when schemas is not an array', () => {
    const input = { schemas: null } as any;

    expect(filterSchemas(input)).toEqual([]);
  });

  it('should handle single schema', () => {
    const input: SchemasResponse = {
      schemas: [
        {
          id: 'infrastructure-schema',
          title: 'Infrastructure Offering',
          name: 'Infrastructure',
          description: 'Infrastructure schema',
          resourceType: 'INFRASTRUCTURE',
          version: '2.0.0',
        },
      ],
    };

    const result = filterSchemas(input);

    expect(result).toEqual([{ label: 'Infrastructure Offering', value: 'infrastructure-schema' }]);
  });

  it('should handle schemas with special characters in titles', () => {
    const input: SchemasResponse = {
      schemas: [
        {
          id: 'special-schema',
          title: 'Data & Analysis Offering',
          name: 'Special Schema',
          description: 'Schema with special chars',
          resourceType: 'DATA',
          version: '1.0.0',
        },
      ],
    };

    const result = filterSchemas(input);

    expect(result).toEqual([{ label: 'Data & Analysis Offering', value: 'special-schema' }]);
  });

  it('should preserve order of schemas', () => {
    const input: SchemasResponse = {
      schemas: [
        {
          id: 'schema-1',
          title: 'Z Schema',
          name: 'Z',
          description: 'Last alphabetically',
          resourceType: 'DATA',
          version: '1.0.0',
        },
        {
          id: 'schema-2',
          title: 'A Schema',
          name: 'A',
          description: 'First alphabetically',
          resourceType: 'APPLICATION',
          version: '1.0.0',
        },
        {
          id: 'schema-3',
          title: 'M Schema',
          name: 'M',
          description: 'Middle alphabetically',
          resourceType: 'INFRASTRUCTURE',
          version: '1.0.0',
        },
      ],
    };

    const result = filterSchemas(input);

    expect(result).toEqual([
      { label: 'Z Schema', value: 'schema-1' },
      { label: 'A Schema', value: 'schema-2' },
      { label: 'M Schema', value: 'schema-3' },
    ]);
  });

  it('should handle large number of schemas', () => {
    const schemas = Array.from({ length: 100 }, (_, i) => ({
      id: `schema-${i}`,
      title: `Schema ${i}`,
      name: `Schema ${i}`,
      description: `Description ${i}`,
      resourceType: i % 3 === 0 ? 'DATA' : i % 3 === 1 ? 'APPLICATION' : 'INFRASTRUCTURE',
      version: '1.0.0',
    }));

    const input: SchemasResponse = { schemas };

    const result = filterSchemas(input);

    expect(result).toHaveLength(100);
    expect(result[0]).toEqual({ label: 'Schema 0', value: 'schema-0' });
    expect(result[99]).toEqual({ label: 'Schema 99', value: 'schema-99' });
  });
});
