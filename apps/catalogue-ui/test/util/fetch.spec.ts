import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { enhancedFetch } from '@/util/fetch';

describe('fetch.ts', () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    // Create a mock response with all the necessary properties
    mockResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers({
        'Content-Type': 'application/json',
        'Original-Header': 'original-value',
      }),
      url: 'https://api.example.com/data',
      json: vi.fn().mockResolvedValue({ data: 'test' }),
      text: vi.fn().mockResolvedValue('test text'),
      blob: vi.fn().mockResolvedValue(new Blob()),
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
      clone: vi.fn().mockReturnValue(mockResponse),
    };

    // Mock the global fetch function
    mockFetch = vi.fn().mockResolvedValue(mockResponse);
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('enhancedFetch', () => {
    it('calls the native fetch function with correct parameters', async () => {
      const url = 'https://api.example.com/test';
      const init = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'data' }),
      };

      await enhancedFetch(url, init);

      expect(mockFetch).toHaveBeenCalledWith(url, init);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('adds X-Original-URL header when input is a string', async () => {
      const url = 'https://api.example.com/test';

      const response = await enhancedFetch(url);

      expect(response.headers.get('X-Original-URL')).toBe(url);
    });

    it('adds X-Original-URL header when input is a URL object', async () => {
      const url = new URL('https://api.example.com/test');

      const response = await enhancedFetch(url);

      expect(response.headers.get('X-Original-URL')).toBe(url.toString());
    });

    it('adds X-Original-URL header when input is a Request object', async () => {
      const requestUrl = 'https://api.example.com/test';
      const request = new Request(requestUrl);

      const response = await enhancedFetch(request);

      expect(response.headers.get('X-Original-URL')).toBe(requestUrl);
    });

    it('preserves original response headers', async () => {
      const url = 'https://api.example.com/test';

      const response = await enhancedFetch(url);

      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(response.headers.get('Original-Header')).toBe('original-value');
    });

    it('preserves all response properties except headers', async () => {
      const url = 'https://api.example.com/test';

      const response = await enhancedFetch(url);

      expect(response.ok).toBe(true);
      expect(response.status).toBe(200);
      expect(response.statusText).toBe('OK');
      expect(response.url).toBe('https://api.example.com/data');
    });

    it('preserves response methods and binds them correctly', async () => {
      const url = 'https://api.example.com/test';

      const response = await enhancedFetch(url);

      // Test that methods are still callable and bound correctly
      const jsonData = await response.json();
      expect(jsonData).toEqual({ data: 'test' });
      expect(mockResponse.json).toHaveBeenCalledTimes(1);

      const textData = await response.text();
      expect(textData).toBe('test text');
      expect(mockResponse.text).toHaveBeenCalledTimes(1);
    });

    it('handles fetch without init parameter', async () => {
      const url = 'https://api.example.com/test';

      const response = await enhancedFetch(url);

      expect(mockFetch).toHaveBeenCalledWith(url, undefined);
      expect(response.headers.get('X-Original-URL')).toBe(url);
    });

    it('handles complex URL with query parameters', async () => {
      const url = 'https://api.example.com/test?param1=value1&param2=value2';

      const response = await enhancedFetch(url);

      expect(response.headers.get('X-Original-URL')).toBe(url);
    });

    it('handles URL with authentication and special characters', async () => {
      const url = 'https://user:pass@api.example.com/test?query=special%20chars';

      const response = await enhancedFetch(url);

      expect(response.headers.get('X-Original-URL')).toBe(url);
    });

    it('proxy behavior: allows property modification on proxy object', async () => {
      const url = 'https://api.example.com/test';

      const response = await enhancedFetch(url);

      // Store original value
      const originalStatus = response.status;
      expect(originalStatus).toBe(200);

      // The proxy allows assignment to the proxy object itself
      (response as any).status = 500;

      // Since the proxy doesn't have a set handler, this modification is allowed
      // The actual behavior depends on the proxy implementation
      // Let's test what actually happens
      expect(response.status).toBe(500); // Property was set on the proxy
    });

    it('handles response with empty headers', async () => {
      const emptyHeadersResponse = {
        ...mockResponse,
        headers: new Headers(),
      };
      mockFetch.mockResolvedValue(emptyHeadersResponse);
      
      const url = 'https://api.example.com/test';

      const response = await enhancedFetch(url);

      expect(response.headers.get('X-Original-URL')).toBe(url);
      expect(response.headers.get('Content-Type')).toBeNull();
    });

    it('handles fetch errors and still adds headers to the response', async () => {
      const errorResponse: Partial<Response> = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Headers(),
        url: 'https://api.example.com/notfound',
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
        text: vi.fn().mockResolvedValue('Not Found'),
        blob: vi.fn().mockResolvedValue(new Blob()),
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0)),
      };
      
      // Add clone method after the object is created to avoid circular reference
      errorResponse.clone = vi.fn().mockReturnValue(errorResponse);

      mockFetch.mockResolvedValue(errorResponse);

      const url = 'https://api.example.com/notfound';
      const response = await enhancedFetch(url);

      expect(response.ok).toBe(false);
      expect(response.status).toBe(404);
      expect(response.headers.get('X-Original-URL')).toBe(url);
    });

    it('handles Request object with custom headers', async () => {
      const requestUrl = 'https://api.example.com/test';
      const request = new Request(requestUrl, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer token123',
          'Custom-Header': 'custom-value',
        },
      });

      const response = await enhancedFetch(request);

      expect(mockFetch).toHaveBeenCalledWith(request, undefined);
      expect(response.headers.get('X-Original-URL')).toBe(requestUrl);
    });

    it('preserves response clone functionality', async () => {
      const url = 'https://api.example.com/test';

      const response = await enhancedFetch(url);
      const clonedResponse = response.clone();

      expect(mockResponse.clone).toHaveBeenCalledTimes(1);
      // The clone method should be called and return the mocked result
      expect(clonedResponse).toBeDefined();
    });

    it('handles URL object with port and path', async () => {
      const url = new URL('https://api.example.com:8080/v1/data');

      const response = await enhancedFetch(url);

      expect(response.headers.get('X-Original-URL')).toBe('https://api.example.com:8080/v1/data');
    });

    it('handles localhost URLs', async () => {
      const url = 'http://localhost:3000/api/test';

      const response = await enhancedFetch(url);

      expect(response.headers.get('X-Original-URL')).toBe(url);
    });

    it('preserves all enumerable properties of the response', async () => {
      const url = 'https://api.example.com/test';

      const response = await enhancedFetch(url);

      // Check that we can access common Response properties
      expect('ok' in response).toBe(true);
      expect('status' in response).toBe(true);
      expect('headers' in response).toBe(true);
      expect('url' in response).toBe(true);
      expect('json' in response).toBe(true);
      expect('text' in response).toBe(true);
    });

    it('handles simultaneous calls correctly', async () => {
      const url1 = 'https://api.example.com/test1';
      const url2 = 'https://api.example.com/test2';

      const [response1, response2] = await Promise.all([
        enhancedFetch(url1),
        enhancedFetch(url2),
      ]);

      expect(response1.headers.get('X-Original-URL')).toBe(url1);
      expect(response2.headers.get('X-Original-URL')).toBe(url2);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});
