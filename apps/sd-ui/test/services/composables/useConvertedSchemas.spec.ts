import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useConvertedSchemas, useVersionedConvertedSchemas } from '@/services/composables/useConvertedSchemas';
import { fetchLocalEndpoint } from '@/util/services';
import type { ConvertedSchema } from '@/types/shapes';

vi.mock('@/util/services', () => ({
  fetchLocalEndpoint: vi.fn(),
}));

const mockFetch = vi.mocked(fetchLocalEndpoint);

const makeSchema = (overrides: Partial<ConvertedSchema['root']> = {}): ConvertedSchema => ({
  root: {
    DataOfferingShape: {
      type: 'object',
      properties: {
        'simpl:assetProperties': {
          type: 'object',
          rdfType: 'simpl:AssetProperties',
          properties: {
            'simpl:providerDataAddress': {
              type: 'object',
              properties: {
                'simpl:endpoint': { type: 'string' },
                'simpl:bucketName': { type: 'string' },
              },
            },
          },
        },
      },
    },
    ...overrides,
  },
  prefixes: { simpl: 'http://w3id.org/gaia-x/simpl#' },
});

describe('useConvertedSchemas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls fetchLocalEndpoint with the correct URL and options', async () => {
    mockFetch.mockResolvedValue({ data: ref(null), error: ref(null), isLoading: ref(false) });

    await useConvertedSchemas('DataSchema');

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/schemas/DataSchema/content?schemaUIType=sdCreation',
      {
        method: 'GET',
        errorIdentifier: 'TTL_CONVERT_ERROR',
        apiName: 'catalogue UI ttl to json',
      },
      expect.any(Function)
    );
  });

  it('passes a transformer function as the third argument', async () => {
    mockFetch.mockResolvedValue({ data: ref(null), error: ref(null), isLoading: ref(false) });

    await useConvertedSchemas('ServiceSchema');

    const transformer = mockFetch.mock.calls[0][2];
    expect(typeof transformer).toBe('function');
  });

  describe('transformConvertedSchema (via transformer argument)', () => {
    let transformer: (schema: ConvertedSchema) => ConvertedSchema;

    beforeEach(async () => {
      mockFetch.mockResolvedValue({ data: ref(null), error: ref(null), isLoading: ref(false) });
      await useConvertedSchemas('DataSchema');
      transformer = mockFetch.mock.calls[0][2] as (schema: ConvertedSchema) => ConvertedSchema;
    });

    it('replaces simpl:assetProperties on DataOfferingShape with the fixed definition', () => {
      const schema = makeSchema();
      const result = transformer(schema);

      const assetProps = result.root.DataOfferingShape?.properties?.['simpl:assetProperties'];
      expect(assetProps).toEqual({
        type: 'object',
        properties: {
          'simpl:providerDataAddress': {
            title: 'Provider data address',
            type: 'string',
            rdfType: 'xsd:string',
            description: 'Provider Data address',
          },
        },
        child: true,
        rdfType: 'simpl:AssetProperties',
        required: ['simpl:providerDataAddress'],
        title: 'Asset properties',
        description:
          'Basic classification of the service as per provision type and service model.',
      });
    });

    it('returns the same schema object (mutates in place)', () => {
      const schema = makeSchema();
      const result = transformer(schema);
      expect(result).toBe(schema);
    });

    it('does not modify the schema when DataOfferingShape has no simpl:assetProperties', () => {
      const schema: ConvertedSchema = {
        root: {
          DataOfferingShape: {
            type: 'object',
            properties: {
              'simpl:name': { type: 'string' },
            },
          },
        },
        prefixes: {},
      };
      const result = transformer(schema);
      expect(result.root.DataOfferingShape?.properties?.['simpl:assetProperties']).toBeUndefined();
    });

    it('does not modify schemas that have no DataOfferingShape', () => {
      const schema: ConvertedSchema = {
        root: {
          ServiceOfferingShape: {
            type: 'object',
            properties: {},
          },
        },
        prefixes: {},
      };
      const result = transformer(schema);
      expect(result.root).toEqual(schema.root);
    });

    it('leaves other properties on DataOfferingShape untouched', () => {
      const schema = makeSchema();
      schema.root.DataOfferingShape!.properties!['simpl:name'] = { type: 'string' };
      transformer(schema);
      expect(schema.root.DataOfferingShape?.properties?.['simpl:name']).toEqual({ type: 'string' });
    });

    it('preserves prefixes', () => {
      const schema = makeSchema();
      const result = transformer(schema);
      expect(result.prefixes).toEqual({ simpl: 'http://w3id.org/gaia-x/simpl#' });
    });

    it('replaces simpl:providerDataAddress with a plain string field (not a nested object)', () => {
      const schema = makeSchema();
      transformer(schema);
      const providerDataAddress =
        schema.root.DataOfferingShape?.properties?.['simpl:assetProperties']?.properties?.[
          'simpl:providerDataAddress'
        ];
      expect(providerDataAddress?.type).toBe('string');
      expect(providerDataAddress?.properties).toBeUndefined();
    });
  });
});

describe('useVersionedConvertedSchemas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls fetchLocalEndpoint with the correct versioned URL and options', async () => {
    mockFetch.mockResolvedValue({ data: ref(null), error: ref(null), isLoading: ref(false) });

    await useVersionedConvertedSchemas('DataSchema', '2.1.0');

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/schemas/DataSchema/2.1.0/content?schemaUIType=sdCreation',
      {
        method: 'GET',
        errorIdentifier: 'TTL_CONVERT_ERROR',
        apiName: 'catalogue UI ttl to json',
      },
      expect.any(Function)
    );
  });

  it('includes the schemaId and version in the URL', async () => {
    mockFetch.mockResolvedValue({ data: ref(null), error: ref(null), isLoading: ref(false) });

    await useVersionedConvertedSchemas('ServiceSchema', '3.0.0-beta');

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('ServiceSchema');
    expect(url).toContain('3.0.0-beta');
  });

  it('passes a transformer function as the third argument', async () => {
    mockFetch.mockResolvedValue({ data: ref(null), error: ref(null), isLoading: ref(false) });

    await useVersionedConvertedSchemas('ServiceSchema', '1.0.0');

    const transformer = mockFetch.mock.calls[0][2];
    expect(typeof transformer).toBe('function');
  });
});
