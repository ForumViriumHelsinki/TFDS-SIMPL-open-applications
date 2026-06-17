import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchQuickSearchResponse,
  fetchAdvancedSearchResponse,
  getSelfDescriptionById,
} from '@/services/mock/mockSearch';

// Mock the JSON imports
vi.mock('@/services/mock/fixtures/mockResults.json', () => ({
  default: {
    totalCount: 100,
    items: [
      {
        n: {
          claimsGraphUri: ['did:web:registry.gaia-x.eu:DataOffering:test-1'],
          offeringType: 'data',
          name: 'Mock Test Asset 1',
          description: 'Mock asset description 1',
          inLanguage: 'en',
          serviceAccessPoint: 'https://sd-ui.dev.simpl-europe.eu',
        },
      },
      {
        n: {
          claimsGraphUri: ['did:web:registry.gaia-x.eu:DataOffering:test-2'],
          offeringType: 'infrastructure',
          name: 'Mock Test Asset 2',
          description: 'Mock asset description 2',
          inLanguage: 'en',
          serviceAccessPoint: 'https://sd-ui.dev.simpl-europe.eu',
        },
      },
    ],
  },
}));

vi.mock('@/services/mock/fixtures/mockSDdata.json', () => ({
  default: {
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      'https://w3id.org/security/suites/jws-2020/v1',
    ],
    credentialSubject: {
      '@id': 'did:web:registry.gaia-x.eu:DataOffering:test-sd-id',
      'rdf:type': {
        '@id': 'simpl:DataOffering',
      },
      'simpl:name': 'Mock Self Description',
      'simpl:description': 'Mock self description for testing',
    },
  },
}));

describe('mockSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock setTimeout to avoid actual delays in tests
    vi.stubGlobal(
      'setTimeout',
      vi.fn((callback) => {
        callback();
        return 1;
      })
    );
  });

  describe('fetchQuickSearchResponse', () => {
    it('should return search results with 200 status', async () => {
      const searchText = 'test query';

      const response = await fetchQuickSearchResponse(searchText);

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');

      const data = await response.json();
      expect(data).toHaveProperty('totalCount');
      expect(data).toHaveProperty('items');
      expect(Array.isArray(data.items)).toBe(true);
      expect(data.totalCount).toBe(100);
      expect(data.items).toHaveLength(2);
    });

    it('should return results for null search text', async () => {
      const response = await fetchQuickSearchResponse(null);

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('totalCount');
      expect(data).toHaveProperty('items');
    });

    it('should accept optional keycloak token', async () => {
      const searchText = 'test query';

      const response = await fetchQuickSearchResponse(searchText, 'test-token');

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
    });

    it('should return consistent result structure', async () => {
      const searchText = 'test query';

      const response = await fetchQuickSearchResponse(searchText);
      const data = await response.json();

      data.items.forEach((item: any) => {
        expect(item).toHaveProperty('n');
        expect(item.n).toHaveProperty('claimsGraphUri');
        expect(item.n).toHaveProperty('offeringType');
        expect(item.n).toHaveProperty('name');
        expect(item.n).toHaveProperty('description');
        expect(Array.isArray(item.n.claimsGraphUri)).toBe(true);
      });
    });
  });

  describe('fetchAdvancedSearchResponse', () => {
    it('should return advanced search results with 200 status', async () => {
      const requestBody = {
        query: 'test advanced query',
        filters: {
          offeringType: 'data',
        },
      };

      const response = await fetchAdvancedSearchResponse(requestBody);

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');

      const data = await response.json();
      expect(data).toHaveProperty('totalCount');
      expect(data).toHaveProperty('items');
      expect(Array.isArray(data.items)).toBe(true);
      expect(data.totalCount).toBe(100);
      expect(data.items).toHaveLength(2);
    });

    it('should accept optional keycloak token', async () => {
      const requestBody = {
        query: 'test advanced query',
        filters: {},
      };

      const response = await fetchAdvancedSearchResponse(requestBody, 'test-token');

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
    });

    it('should handle complex request body', async () => {
      const requestBody = {
        query: 'complex query',
        filters: {
          offeringType: ['data', 'infrastructure'],
          categories: ['finance', 'healthcare'],
          dateRange: {
            from: '2024-01-01',
            to: '2024-12-31',
          },
        },
        sort: {
          field: 'name',
          order: 'asc',
        },
      };

      const response = await fetchAdvancedSearchResponse(requestBody);

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('totalCount');
      expect(data).toHaveProperty('items');
    });

    it('should return same structure as quick search', async () => {
      const requestBody = { query: 'test' };

      const response = await fetchAdvancedSearchResponse(requestBody);
      const data = await response.json();

      data.items.forEach((item: any) => {
        expect(item).toHaveProperty('n');
        expect(item.n).toHaveProperty('claimsGraphUri');
        expect(item.n).toHaveProperty('offeringType');
        expect(item.n).toHaveProperty('name');
        expect(item.n).toHaveProperty('description');
      });
    });
  });

  describe('getSelfDescriptionById', () => {
    it('should return self description with 200 status', async () => {
      const id = 'test-sd-id';

      const response = await getSelfDescriptionById(id);

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');

      const data = await response.json();
      expect(data).toHaveProperty('@context');
      expect(data).toHaveProperty('credentialSubject');
      expect(Array.isArray(data['@context'])).toBe(true);
    });

    it('should accept optional keycloak token', async () => {
      const id = 'test-sd-id';

      const response = await getSelfDescriptionById(id, 'test-token');

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
    });

    it('should return valid credential structure', async () => {
      const id = 'test-sd-id';

      const response = await getSelfDescriptionById(id);
      const data = await response.json();

      expect(data['@context']).toContain('https://www.w3.org/2018/credentials/v1');
      expect(data['@context']).toContain('https://w3id.org/security/suites/jws-2020/v1');
      expect(data.credentialSubject).toHaveProperty('@id');
      expect(data.credentialSubject['@id']).toBe(
        'did:web:registry.gaia-x.eu:DataOffering:test-sd-id'
      );
    });

    it('should return self description for any ID', async () => {
      const testIds = ['id-1', 'id-2', 'custom-identifier', '12345'];

      for (const id of testIds) {
        const response = await getSelfDescriptionById(id);
        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data).toHaveProperty('@context');
        expect(data).toHaveProperty('credentialSubject');
      }
    });

    it('should return consistent self description data structure', async () => {
      const id = 'test-consistency';

      const response = await getSelfDescriptionById(id);
      const data = await response.json();

      expect(data.credentialSubject).toHaveProperty('rdf:type');
      expect(data.credentialSubject['rdf:type']).toHaveProperty('@id');
      expect(data.credentialSubject['simpl:name']).toBe('Mock Self Description');
      expect(data.credentialSubject['simpl:description']).toBe('Mock self description for testing');
    });
  });
});
