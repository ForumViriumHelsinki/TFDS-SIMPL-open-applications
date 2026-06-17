import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildSchemaResponse } from '@/pages/api/schemas/_buildSchemaResponse';

const { mockImport, mockParseStream } = vi.hoisted(() => ({
  mockImport: vi.fn(),
  mockParseStream: vi.fn(),
}));

vi.mock('@rdfjs/formats-common', () => ({
  default: {
    parsers: { import: mockImport },
  },
}));

vi.mock('@/util/ttlParser/ttlParser', () => ({
  parseStream: mockParseStream,
}));

describe('buildSchemaResponse', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('when the TTL parser returns null', () => {
    it('returns a 500 response', async () => {
      mockImport.mockReturnValue(null);

      const response = await buildSchemaResponse('bad content', 'sdCreation');

      expect(response.status).toBe(500);
    });

    it('returns an error body with errorDescription', async () => {
      mockImport.mockReturnValue(null);

      const response = await buildSchemaResponse('bad content', null);
      const body = await response.json();

      expect(body).toEqual({ errorDescription: 'Failed to parse schema' });
    });

    it('sets content-type to application/json', async () => {
      mockImport.mockReturnValue(null);

      const response = await buildSchemaResponse('bad content', null);

      expect(response.headers.get('content-type')).toBe('application/json');
    });
  });

  describe('OfferingShape filtering', () => {
    it('filters root to only entries ending with OfferingShape', async () => {
      mockImport.mockReturnValue({});
      mockParseStream.mockResolvedValue({
        root: {
          ServiceOfferingShape: { type: 'object' },
          DataOfferingShape: { type: 'object' },
          SomeOtherShape: { type: 'object' },
        },
        prefixes: {},
      });

      const response = await buildSchemaResponse('...turtle...', 'sdCreation');
      const body = await response.json();

      expect(body.root).toEqual({
        ServiceOfferingShape: { type: 'object' },
        DataOfferingShape: { type: 'object' },
      });
      expect(body.root.SomeOtherShape).toBeUndefined();
    });

    it('returns the full root when no OfferingShape entries exist', async () => {
      mockImport.mockReturnValue({});
      mockParseStream.mockResolvedValue({
        root: {
          SomeShape: { type: 'object' },
          AnotherShape: { type: 'object' },
        },
        prefixes: {},
      });

      const response = await buildSchemaResponse('...turtle...', null);
      const body = await response.json();

      expect(body.root).toEqual({
        SomeShape: { type: 'object' },
        AnotherShape: { type: 'object' },
      });
    });
  });

  describe('schemaUIType forwarding', () => {
    it('passes a valid schemaUIType directly to parseStream', async () => {
      mockImport.mockReturnValue({});
      mockParseStream.mockResolvedValue({ root: {}, prefixes: {} });

      await buildSchemaResponse('...turtle...', 'advancedSearch');

      expect(mockParseStream).toHaveBeenCalledWith(expect.anything(), 'advancedSearch');
    });

    it('falls back to "default" for an invalid schemaUIType', async () => {
      mockImport.mockReturnValue({});
      mockParseStream.mockResolvedValue({ root: {}, prefixes: {} });

      await buildSchemaResponse('...turtle...', 'notAValidType');

      expect(mockParseStream).toHaveBeenCalledWith(expect.anything(), 'default');
    });

    it('falls back to "default" when schemaUIType is null', async () => {
      mockImport.mockReturnValue({});
      mockParseStream.mockResolvedValue({ root: {}, prefixes: {} });

      await buildSchemaResponse('...turtle...', null);

      expect(mockParseStream).toHaveBeenCalledWith(expect.anything(), 'default');
    });
  });

  describe('successful response', () => {
    it('includes prefixes in the response body', async () => {
      mockImport.mockReturnValue({});
      mockParseStream.mockResolvedValue({
        root: { ServiceOfferingShape: {} },
        prefixes: { gax: 'https://gaia-x.eu/gax#' },
      });

      const response = await buildSchemaResponse('...turtle...', 'default');
      const body = await response.json();

      expect(body.prefixes).toEqual({ gax: 'https://gaia-x.eu/gax#' });
    });

    it('sets content-type to application/json', async () => {
      mockImport.mockReturnValue({});
      mockParseStream.mockResolvedValue({ root: {}, prefixes: {} });

      const response = await buildSchemaResponse('...turtle...', null);

      expect(response.headers.get('content-type')).toBe('application/json');
    });
  });
});
