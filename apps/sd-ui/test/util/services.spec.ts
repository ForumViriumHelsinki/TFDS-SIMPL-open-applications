import { describe, it, expect, vi } from 'vitest';
import { fetchLocalEndpoint, buildEndpointUrl } from '@/util/services';
import { transformAnyErrorToUIError } from '@/util/errors';

describe('fetchLocalEndpoint', () => {
  const endpoint = '/test-endpoint';
  const method = 'GET';
  const errorIdentifier = 'test-error';
  const apiName = 'Test';
  const defaultData = null;
  const body = { key: 'value' };

  it('should fetch data successfully', async () => {
    const mockResponse = { data: 'test data' };
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        text: () => Promise.resolve(JSON.stringify(mockResponse)),
        json: () => Promise.resolve(mockResponse),
      } as Response)
    );

    const result = await fetchLocalEndpoint(endpoint, {
      method,
      errorIdentifier,
      apiName,
      body,
      defaultData,
    });

    expect(result.data.value).toEqual(mockResponse);
    expect(result.error.value).toBeNull();
    expect(result.isLoading.value).toBe(false);
  });

  it('should handle API error response', async () => {
    const mockErrorResponse = {
      description: 'Error Description (test-error)',
      title: 'Error Title',
    };

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve(mockErrorResponse),
      } as Response)
    );

    const result = await fetchLocalEndpoint(endpoint, {
      method,
      errorIdentifier,
      apiName,
      body,
      defaultData,
    });

    expect(result.data.value).toBe(defaultData);
    expect(result.error.value).toEqual({
      description: 'Error details are not available (test-error)',
      title: 'Test API: Error Title',
    });
    expect(result.isLoading.value).toBe(false);
  });

  it('should handle fetch error', async () => {
    const mockError = new Error('Fetch error');
    global.fetch = vi.fn(() => Promise.reject(mockError));

    const result = await fetchLocalEndpoint(endpoint, {
      method,
      errorIdentifier,
      apiName,
      body,
      defaultData,
    });

    expect(result.data.value).toBe(defaultData);
    expect(result.error.value).toEqual({
      description: 'Fetch error (test-error)',
      title: 'Test API: An error occurred while fetching data',
    });
    expect(result.isLoading.value).toBe(false);
  });

  it('should transform data if dataTransformCallback is provided', async () => {
    const mockResponse = { data: 'test data' };
    const transformedData = { transformed: 'data' };
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: () => Promise.resolve(mockResponse),
      } as Response)
    );

    const dataTransformCallback = (data: typeof mockResponse) => transformedData;

    const result = await fetchLocalEndpoint(
      endpoint,
      {
        method,
        errorIdentifier,
        apiName,
        body,
        defaultData,
      },
      dataTransformCallback
    );

    expect(result.data.value).toEqual(transformedData);
    expect(result.error.value).toBeNull();
    expect(result.isLoading.value).toBe(false);
  });

  it('falls back to response.text() when response.json() throws', async () => {
    const textBody = 'plain text response';
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        bodyUsed: false,
        headers: { get: () => null },
        json: () => Promise.reject(new Error('not json')),
        text: () => Promise.resolve(textBody),
      } as unknown as Response)
    );

    const result = await fetchLocalEndpoint(endpoint, { method, errorIdentifier, apiName, defaultData });
    expect(result.data.value).toBe(textBody);
    expect(result.error.value).toBeNull();
  });
});

describe('buildEndpointUrl', () => {
  it('replaces a single placeholder with the encoded param value', () => {
    expect(buildEndpointUrl('/api/{id}', { id: 'abc' })).toBe('/api/abc');
  });

  it('URL-encodes special characters in param values', () => {
    expect(buildEndpointUrl('/api/{name}', { name: 'hello world' })).toBe('/api/hello%20world');
  });

  it('replaces multiple placeholders', () => {
    expect(buildEndpointUrl('/api/{a}/{b}', { a: 'foo', b: 'bar' })).toBe('/api/foo/bar');
  });

  it('throws when a required placeholder param is missing', () => {
    expect(() => buildEndpointUrl('/api/{id}', {})).toThrow('Missing required URL parameters: id');
  });

  it('throws listing all missing params', () => {
    expect(() => buildEndpointUrl('/api/{a}/{b}', {})).toThrow('Missing required URL parameters: a, b');
  });
});
