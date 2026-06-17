import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import { getSchemas, fetchSchemaData } from '@/services/mock/mockAdvancedSearch';

// Mock fs module
vi.mock('fs', () => ({
  default: {
    readFileSync: vi.fn(),
  },
}));

describe('mockAdvancedSearch', () => {
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

  describe('getSchemas', () => {
    it('should return categorized shapes with 200 status', async () => {
      const response = await getSchemas();

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');

      const data = await response.json();
      expect(data).toEqual({
        Service: [
          'infrastructure-offeringShape.ttl',
          'data-offeringShape.ttl',
          'application-offeringShape.ttl',
        ],
        Contract: ['contract-templateShape.ttl'],
      });
    });

    it('should accept optional keycloak token', async () => {
      const response = await getSchemas('test-token');

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
    });

    it('should return consistent shape categories', async () => {
      const response = await getSchemas();
      const data = await response.json();

      expect(data).toHaveProperty('Service');
      expect(data).toHaveProperty('Contract');
      expect(Array.isArray(data.Service)).toBe(true);
      expect(Array.isArray(data.Contract)).toBe(true);
      expect(data.Service).toHaveLength(3);
      expect(data.Contract).toHaveLength(1);
    });

    it('should include all expected service shapes', async () => {
      const response = await getSchemas();
      const data = await response.json();

      expect(data.Service).toContain('infrastructure-offeringShape.ttl');
      expect(data.Service).toContain('data-offeringShape.ttl');
      expect(data.Service).toContain('application-offeringShape.ttl');
    });

    it('should include contract template shape', async () => {
      const response = await getSchemas();
      const data = await response.json();

      expect(data.Contract).toContain('contract-templateShape.ttl');
    });

    it('should return readonly categorized object', async () => {
      const response1 = await getSchemas();
      const response2 = await getSchemas();

      const data1 = await response1.json();
      const data2 = await response2.json();

      expect(data1).toEqual(data2);
    });
  });

  describe('fetchSchemaData', () => {
    it('should return TTL content with 200 status', async () => {
      const mockTtlContent = `@prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix simpl: <http://w3id.org/gaia-x/simpl#> .

simpl:DataOfferingShape
    a sh:NodeShape ;
    sh:targetClass simpl:DataOffering ;
    sh:property [
        sh:path simpl:name ;
        sh:datatype xsd:string ;
        sh:minCount 1 ;
        sh:maxCount 1 ;
    ] .`;

      vi.mocked(fs.readFileSync).mockReturnValue(mockTtlContent);

      const shapeId = 'data-offeringShape.ttl';
      const response = await fetchSchemaData(shapeId);

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/turtle');

      const content = await response.text();
      expect(content).toBe(mockTtlContent);
    });

    it('should accept optional keycloak token', async () => {
      const mockTtlContent = '@prefix test: <http://example.org/> .';
      vi.mocked(fs.readFileSync).mockReturnValue(mockTtlContent);

      const shapeId = 'test-shape.ttl';
      const response = await fetchSchemaData(shapeId, 'test-token');

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
    });

    it('should read from correct file path', async () => {
      const mockTtlContent = 'mock content';
      vi.mocked(fs.readFileSync).mockReturnValue(mockTtlContent);

      const shapeId = 'infrastructure-offeringShape.ttl';
      await fetchSchemaData(shapeId);

      expect(fs.readFileSync).toHaveBeenCalledWith('/test/fixtures/testingShape.ttl', 'utf-8');
      expect(fs.readFileSync).toHaveBeenCalledTimes(1);
    });

    it('should work with different shape IDs', async () => {
      const mockTtlContent = 'test ttl content';
      vi.mocked(fs.readFileSync).mockReturnValue(mockTtlContent);

      const shapeIds = [
        'infrastructure-offeringShape.ttl',
        'data-offeringShape.ttl',
        'application-offeringShape.ttl',
        'contract-templateShape.ttl',
      ];

      for (const shapeId of shapeIds) {
        const response = await fetchSchemaData(shapeId);
        expect(response.status).toBe(200);

        const content = await response.text();
        expect(content).toBe(mockTtlContent);
      }

      expect(fs.readFileSync).toHaveBeenCalledTimes(shapeIds.length);
    });

    it('should handle file reading errors gracefully', async () => {
      vi.mocked(fs.readFileSync).mockImplementation(() => {
        throw new Error('File not found');
      });

      const shapeId = 'non-existent-shape.ttl';

      await expect(fetchSchemaData(shapeId)).rejects.toThrow('File not found');
    });

    it('should return text/turtle content type', async () => {
      const mockTtlContent = '@prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#> .';
      vi.mocked(fs.readFileSync).mockReturnValue(mockTtlContent);

      const shapeId = 'test-shape.ttl';
      const response = await fetchSchemaData(shapeId);

      expect(response.headers.get('Content-Type')).toBe('text/turtle');
    });

    it('should preserve TTL content exactly', async () => {
      const mockTtlContent = `@prefix sh: <http://www.w3.org/ns/shacl#> .
@prefix simpl: <http://w3id.org/gaia-x/simpl#> .
@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .

simpl:DataOfferingShape
    a sh:NodeShape ;
    sh:targetClass simpl:DataOffering ;
    sh:property [
        sh:path simpl:name ;
        sh:datatype xsd:string ;
        sh:minCount 1 ;
        sh:maxCount 1 ;
        sh:description "The name of the data offering" ;
    ] ,
    [
        sh:path simpl:description ;
        sh:datatype xsd:string ;
        sh:minCount 1 ;
        sh:maxCount 1 ;
        sh:description "A description of the data offering" ;
    ] .`;

      vi.mocked(fs.readFileSync).mockReturnValue(mockTtlContent);

      const shapeId = 'data-offeringShape.ttl';
      const response = await fetchSchemaData(shapeId);
      const content = await response.text();

      expect(content).toBe(mockTtlContent);
      expect(content).toContain('@prefix sh:');
      expect(content).toContain('simpl:DataOfferingShape');
      expect(content).toContain('sh:targetClass simpl:DataOffering');
    });
  });
});
