import { describe, it, expect, vi } from 'vitest';
import { fetchLocalEndpoint } from '@/util/services';

describe('fetchLocalEndpoint', () => {
  const endpoint = '/test-endpoint';
  const method = 'GET';
  const errorIdentifier = 'test-error';
  const apiName = 'Test API';
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
      description: '(test-error)\nError details are not available',
      title: 'Test API API: Error Title',
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
      description: '(test-error)\nFetch error',
      title: 'Test API API: An error occurred while fetching data',
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
});
