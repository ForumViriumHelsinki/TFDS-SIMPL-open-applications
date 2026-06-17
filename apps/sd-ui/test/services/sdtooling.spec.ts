import { describe, it, expect, vi, beforeEach } from 'vitest';
import { enrichAndValidateSchema } from '@/services/sdtooling';
import { getResourceAddressByAssetId } from '@/services/sdtooling';
import { fetchVersionedSchemaData } from '@/services/sdtooling';
import { getResourceDescriptionVersions } from '@/services/sdtooling';
import { enhancedFetch } from '@/util/fetch';

vi.mock('@/util/fetch', () => ({
  enhancedFetch: vi.fn(),
}));

vi.mock('@/util/getEnv', () => ({
  getPublicEnv: () => ({
    PUBLIC_CREATION_WIZARD_API_URL: 'https://api.example.com',
    PUBLIC_CREATION_WIZARD_API_VERSION: 'v3',
  }),
}));

const mockFetch = vi.mocked(enhancedFetch);

const makeOkResponse = (body: object = {}) => new Response(JSON.stringify(body), { status: 200 });

describe('enrichmentV3DataTransformation (via enrichAndValidateSchema)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue(makeOkResponse());
  });

  it('extracts simpl:providerDataAddress as the resourceAddress value', async () => {
    const data = {
      'simpl:assetProperties': {
        'simpl:providerDataAddress': '{"type":"MinioS3","endpoint":"http://example.com"}',
      },
    };

    await enrichAndValidateSchema('DataSchema', 'template-5', data, 'token');

    const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(sentBody.properties.resourceAddress.value).toBe(
      '{"type":"MinioS3","endpoint":"http://example.com"}'
    );
  });

  it('sets templateId on the resourceAddress from the templateId argument', async () => {
    const data = {
      'simpl:assetProperties': {
        'simpl:providerDataAddress': 'some-address',
      },
    };

    await enrichAndValidateSchema('DataSchema', 'template-42', data, 'token');

    const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(sentBody.properties.resourceAddress.templateId).toBe('template-42');
  });

  it('removes simpl:providerDataAddress from sdJson after extraction', async () => {
    const data = {
      'simpl:assetProperties': {
        'simpl:providerDataAddress': 'some-address',
        'simpl:otherField': 'keep-me',
      },
    };

    await enrichAndValidateSchema('DataSchema', 'template-5', data, 'token');

    const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(sentBody.sdJson['simpl:assetProperties']['simpl:providerDataAddress']).toBeUndefined();
  });

  it('leaves other simpl:assetProperties fields in sdJson intact', async () => {
    const data = {
      'simpl:assetProperties': {
        'simpl:providerDataAddress': 'some-address',
        'simpl:otherField': 'keep-me',
      },
    };

    await enrichAndValidateSchema('DataSchema', 'template-5', data, 'token');

    const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(sentBody.sdJson['simpl:assetProperties']['simpl:otherField']).toBe('keep-me');
  });

  it('defaults value to empty string when simpl:providerDataAddress is absent', async () => {
    const data = { 'simpl:generalServiceProperties': { 'simpl:name': 'Test' } };

    await enrichAndValidateSchema('DataSchema', 'template-5', data, 'token');

    const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(sentBody.properties.resourceAddress.value).toBe('');
  });

  it('defaults value to empty string when simpl:assetProperties is absent', async () => {
    const data = {};

    await enrichAndValidateSchema('DataSchema', 'template-5', data, 'token');

    const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(sentBody.properties.resourceAddress.value).toBe('');
  });

  it('wraps the full data object under sdJson', async () => {
    const data = {
      '@id': 'did:web:example',
      'simpl:assetProperties': { 'simpl:providerDataAddress': 'addr' },
    };

    await enrichAndValidateSchema('DataSchema', 'template-5', data, 'token');

    const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(sentBody.sdJson).toHaveProperty('@id', 'did:web:example');
  });

  it('does NOT call enrichmentV3DataTransformation twice (no double-mutation bug)', async () => {
    const data = {
      'simpl:assetProperties': {
        'simpl:providerDataAddress': 'my-address',
      },
    };

    await enrichAndValidateSchema('DataSchema', 'template-5', data, 'token');

    // fetch is called exactly once, with the correct value
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(sentBody.properties.resourceAddress.value).toBe('my-address');
  });
});

describe('enrichAndValidateSchema HTTP call', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls the v3 enriched endpoint with POST and Authorization header', async () => {
    mockFetch.mockResolvedValue(makeOkResponse());

    await enrichAndValidateSchema('DataSchema', 'template-5', {}, 'my-token');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/v3/selfDescriptions/enriched?schemaId=DataSchema',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer my-token',
          'Content-Type': 'application/json',
        }),
      })
    );
  });

  it('returns the response from enhancedFetch', async () => {
    const mockResponse = makeOkResponse({ result: 'ok' });
    mockFetch.mockResolvedValue(mockResponse);

    const result = await enrichAndValidateSchema('DataSchema', 'template-5', {}, 'token');

    expect(result).toBe(mockResponse);
  });

  it('works without a keycloakToken (sends Bearer undefined)', async () => {
    mockFetch.mockResolvedValue(makeOkResponse());

    await enrichAndValidateSchema('DataSchema', 'template-5', {});

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer undefined' }),
      })
    );
  });
});

describe('getResourceAddressByAssetId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls the v1 asset resource-address endpoint with GET', async () => {
    mockFetch.mockResolvedValue(makeOkResponse());

    await getResourceAddressByAssetId('asset-123', 'token-abc');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/v1/resourceAddresses/assets/asset-123',
      {
        method: 'GET',
        headers: {
          Authorization: 'Bearer token-abc',
          Accept: 'application/json',
        },
      }
    );
  });

  it('returns the response from enhancedFetch unchanged', async () => {
    const mockResponse = makeOkResponse({ value: 'ok' });
    mockFetch.mockResolvedValue(mockResponse);

    const result = await getResourceAddressByAssetId('asset-456', 'token-xyz');

    expect(result).toBe(mockResponse);
  });
});

describe('fetchVersionedSchemaData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls the versioned schema endpoint with GET, Authorization and Accept headers', async () => {
    mockFetch.mockResolvedValue(makeOkResponse());

    await fetchVersionedSchemaData('DataSchema', '2.0.0', 'my-token');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/v3/schemas/DataSchema/2.0.0',
      {
        method: 'GET',
        headers: {
          Authorization: 'Bearer my-token',
          Accept: 'text/turtle, application/problem+json',
        },
      }
    );
  });

  it('returns the response from enhancedFetch unchanged', async () => {
    const mockResponse = makeOkResponse({ content: 'turtle' });
    mockFetch.mockResolvedValue(mockResponse);

    const result = await fetchVersionedSchemaData('ServiceSchema', '1.0.0', 'token');

    expect(result).toBe(mockResponse);
  });

  it('works without a keycloakToken (sends Bearer undefined)', async () => {
    mockFetch.mockResolvedValue(makeOkResponse());

    await fetchVersionedSchemaData('ServiceSchema', '1.0.0');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer undefined' }),
      })
    );
  });
});

describe('getResourceDescriptionVersions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue(makeOkResponse());
  });

  it('calls the v1 versions endpoint with GET and default page/pageSize', async () => {
    await getResourceDescriptionVersions('rd-123', 1, 10, 'token-xyz');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/v1/resourceDescriptions/rd-123/versions?page=1&pageSize=10',
      {
        method: 'GET',
        headers: {
          Authorization: 'Bearer token-xyz',
          Accept: 'application/json',
        },
      }
    );
  });

  it('uses custom page and pageSize parameters', async () => {
    await getResourceDescriptionVersions('rd-456', 3, 25, 'token-abc');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/v1/resourceDescriptions/rd-456/versions?page=3&pageSize=25',
      expect.any(Object)
    );
  });

  it('returns the response from enhancedFetch unchanged', async () => {
    const mockResponse = makeOkResponse({ items: [], totalCount: 0 });
    mockFetch.mockResolvedValue(mockResponse);

    const result = await getResourceDescriptionVersions('rd-789', 1, 10, 'token');

    expect(result).toBe(mockResponse);
  });

  it('works without a keycloakToken (sends Bearer undefined)', async () => {
    await getResourceDescriptionVersions('rd-000');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer undefined' }),
      })
    );
  });
});
