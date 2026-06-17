import { describe, it, expect, vi } from 'vitest';
import { formatDataToJsonLd, type ExtendedJsonSchema4 } from '@/util/ttlParser/jsonld';
import { parse } from 'path';

vi.mock('uuid', () => ({
  v4: vi.fn(() => 'mocked-uuid'),
}));

describe('formatDataToJsonLd', () => {
  it('formats data to JSON-LD correctly for an object schema', async () => {
    const data = {
      'person:name': 'John Doe',
      'person:age': 30,
    };

    const schema: ExtendedJsonSchema4 = {
      type: 'object',
      rdfType: 'schema:Person',
      properties: {
        'person:name': { type: 'string', rdfType: 'xsd:string' },
        'person:age': { type: 'number', rdfType: 'xsd:number' },
      },
    };

    const context = {
      schema: 'http://schema.org/',
      xsd: 'http://www.w3.org/2001/XMLSchema#',
    };

    const result = await formatDataToJsonLd(data, schema, context);

    expect(result).toEqual({
      '@context': context,
      '@id': 'did:web:registry.gaia-x.eu:Person:mocked-uuid',
      'rdf:type': { '@id': 'schema:Person' },
      'person:name': 'John Doe',
      'person:age': 30,
    });
  });

  it('formats data to JSON-LD correctly for nested object schema', async () => {
    const data = {
      'person:name': 'John Doe',
      'person:age': 30,
      'person:address': {
        'address:street': '123 Main St',
        'address:city': 'Anytown',
      },
    };

    const schema: ExtendedJsonSchema4 = {
      type: 'object',
      rdfType: 'schema:Person',
      properties: {
        'person:name': { type: 'string', rdfType: 'xsd:string' },
        'person:age': { type: 'number', rdfType: 'xsd:number' },
        'person:address': {
          type: 'object',
          rdfType: 'schema:Address',
          properties: {
            'address:street': { type: 'string', rdfType: 'xsd:string' },
            'address:city': { type: 'string', rdfType: 'xsd:string' },
          },
        },
      },
    };

    const context = {
      schema: 'http://schema.org/',
      xsd: 'http://www.w3.org/2001/XMLSchema#',
    };

    const result = await formatDataToJsonLd(data, schema, context);

    expect(result).toEqual({
      '@context': context,
      '@id': 'did:web:registry.gaia-x.eu:Person:mocked-uuid',
      'rdf:type': { '@id': 'schema:Person' },
      'person:name': 'John Doe',
      'person:age': 30,
      'person:address': {
        'rdf:type': { '@id': schema.properties['person:address'].rdfType },
        ...data['person:address'],
      },
    });
  });

  it('throws an error if a property is not found in the schema', async () => {
    const data = {
      name: 'John Doe',
      unknownProperty: 'unexpected',
    };

    const schema: ExtendedJsonSchema4 = {
      type: 'object',
      rdfType: 'schema:Person',
      properties: {
        name: { type: 'string', rdfType: 'xsd:string' },
      },
    };

    const context = {
      schema: 'http://schema.org/',
      xsd: 'http://www.w3.org/2001/XMLSchema#',
    };

    await expect(formatDataToJsonLd(data, schema, context)).rejects.toThrow(
      'unknownProperty property not found in schema'
    );
  });

  it('formats data with non-string or non-number properties correctly', async () => {
    const data = {
      'event:date': '2025-05-07',
    };

    const schema: ExtendedJsonSchema4 = {
      type: 'object',
      rdfType: 'schema:Event',
      properties: {
        'event:date': { type: 'string', rdfType: 'xsd:date' },
      },
    };

    const context = {
      schema: 'http://schema.org/',
      xsd: 'http://www.w3.org/2001/XMLSchema#',
    };

    const result = await formatDataToJsonLd(data, schema, context);

    expect(result).toEqual({
      '@context': context,
      '@id': 'did:web:registry.gaia-x.eu:Event:mocked-uuid',
      'rdf:type': { '@id': 'schema:Event' },
      'event:date': {
        '@value': '2025-05-07',
        '@type': 'xsd:date',
      },
    });
  });

  it('serialises xsd:decimal values as strings to avoid scientific notation', async () => {
    const data = {
      'offer:price': 100.2,
    };

    const schema: ExtendedJsonSchema4 = {
      type: 'object',
      rdfType: 'schema:Offer',
      properties: {
        'offer:price': { type: 'number', rdfType: 'xsd:decimal' },
      },
    };

    const context = {
      schema: 'http://schema.org/',
      xsd: 'http://www.w3.org/2001/XMLSchema#',
    };

    const result = await formatDataToJsonLd(data, schema, context);

    // @value must be a string so the JSON-LD library cannot rewrite it as
    // scientific notation (e.g. 1.002E2), which the backend rejects for xsd:decimal
    expect(result['offer:price']).toEqual({
      '@value': '100.2',
      '@type': 'xsd:decimal',
    });
  });

  it('serialises xsd:decimal 1.234 as the string "1.234"', async () => {
    const data = { 'offer:price': 1.234 };
    const schema: ExtendedJsonSchema4 = {
      type: 'object',
      rdfType: 'schema:Offer',
      properties: {
        'offer:price': { type: 'number', rdfType: 'xsd:decimal' },
      },
    };
    const context = { schema: 'http://schema.org/', xsd: 'http://www.w3.org/2001/XMLSchema#' };

    const result = await formatDataToJsonLd(data, schema, context);

    expect((result['offer:price'] as any)['@value']).toBe('1.234');
  });

  it('formats data to JSON-LD correctly for an array schema', async () => {
    const data = {
      'array:items': ['item1', 'item2'],
    };

    const schema: ExtendedJsonSchema4 = {
      type: 'object',
      rdfType: 'schema:Array',
      properties: {
        'array:items': {
          type: 'array',
          items: { type: 'string', rdfType: 'xsd:string' },
        },
      },
    };

    const context = {
      schema: 'http://schema.org/',
      xsd: 'http://www.w3.org/2001/XMLSchema#',
    };

    const result = await formatDataToJsonLd(data, schema, context);

    expect(result).toEqual({
      '@context': context,
      '@id': 'did:web:registry.gaia-x.eu:Array:mocked-uuid',
      'rdf:type': { '@id': 'schema:Array' },
      'array:items': ['item1', 'item2'],
    });
  });
});
