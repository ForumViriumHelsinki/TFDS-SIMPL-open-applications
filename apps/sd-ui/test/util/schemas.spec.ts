import { describe, it, expect } from 'vitest';
import { filterSchemas } from '@/util/schemas';
import type { SchemasResponse } from '@/types/schemas';

describe('filterSchemas', () => {
  it('maps schema metadata to label/value objects using resourceType and id', () => {
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
      { label: 'APPLICATION', value: 'application-health' },
      { label: 'DATA', value: 'data-offeringShape' },
    ]);
  });

  it('returns empty array when schemas is empty', () => {
    const input: SchemasResponse = { schemas: [] };
    expect(filterSchemas(input)).toEqual([]);
  });

  it('returns empty array when schemas is missing', () => {
    const input = {} as SchemasResponse;
    expect(filterSchemas(input)).toEqual([]);
  });
});
