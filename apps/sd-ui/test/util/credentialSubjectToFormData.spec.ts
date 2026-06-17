import { describe, it, expect } from 'vitest';
import { credentialSubjectToFormData } from '@/util/credentialSubjectToFormData';

describe('credentialSubjectToFormData', () => {
  it('should strip @context, @id, and rdf:type from root level', () => {
    const credentialSubject = {
      '@context': { simpl: 'http://example.com/' },
      '@id': 'did:web:registry.gaia-x.eu:DataOffering:123',
      'rdf:type': { '@id': 'simpl:DataOffering' },
      'simpl:name': 'Test',
    };

    const result = credentialSubjectToFormData(credentialSubject);

    expect(result).toEqual({ 'simpl:name': 'Test' });
  });

  it('should unwrap @value properties', () => {
    const credentialSubject = {
      'simpl:price': { '@value': 100, '@type': 'xsd:decimal' },
      'simpl:date': { '@value': '2025-01-01', '@type': 'xsd:date' },
    };

    const result = credentialSubjectToFormData(credentialSubject);

    expect(result).toEqual({
      'simpl:price': 100,
      'simpl:date': '2025-01-01',
    });
  });

  it('should pass through plain string and number values', () => {
    const credentialSubject = {
      'simpl:name': 'My Resource',
      'simpl:format': 'csv',
    };

    const result = credentialSubjectToFormData(credentialSubject);

    expect(result).toEqual({
      'simpl:name': 'My Resource',
      'simpl:format': 'csv',
    });
  });

  it('should recursively process nested objects and strip rdf:type', () => {
    const credentialSubject = {
      'simpl:generalServiceProperties': {
        'rdf:type': { '@id': 'simpl:GeneralServiceProperties' },
        'simpl:name': 'Test Name',
        'simpl:description': 'Test Description',
        'simpl:serviceAccessPoint': { '@value': 'https://example.com', '@type': 'xsd:anyURI' },
      },
    };

    const result = credentialSubjectToFormData(credentialSubject);

    expect(result).toEqual({
      'simpl:generalServiceProperties': {
        'simpl:name': 'Test Name',
        'simpl:description': 'Test Description',
        'simpl:serviceAccessPoint': 'https://example.com',
      },
    });
  });

  it('should handle arrays', () => {
    const credentialSubject = {
      'simpl:items': [
        {
          'rdf:type': { '@id': 'simpl:Item' },
          'simpl:value': { '@value': 42, '@type': 'xsd:integer' },
        },
        {
          'rdf:type': { '@id': 'simpl:Item' },
          'simpl:value': { '@value': 99, '@type': 'xsd:integer' },
        },
      ],
    };

    const result = credentialSubjectToFormData(credentialSubject);

    expect(result).toEqual({
      'simpl:items': [{ 'simpl:value': 42 }, { 'simpl:value': 99 }],
    });
  });

  it('should handle a full realistic credentialSubject', () => {
    const credentialSubject = {
      '@context': {
        simpl: 'http://w3id.org/2023/simpl/',
        rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
      },
      '@id': 'did:web:registry.gaia-x.eu:DataOffering:abc-123',
      'rdf:type': { '@id': 'simpl:DataOffering' },
      'simpl:generalServiceProperties': {
        'rdf:type': { '@id': 'simpl:GeneralServiceProperties' },
        'simpl:name': 'My Data Offering',
        'simpl:description': 'A test offering',
        'simpl:offeringType': 'data',
        'simpl:serviceAccessPoint': { '@type': 'xsd:anyURI', '@value': 'https://example.com/api' },
      },
      'simpl:dataProperties': {
        'rdf:type': { '@id': 'simpl:DataProperties' },
        'simpl:format': 'csv',
      },
      'simpl:offeringPrice': {
        'rdf:type': { '@id': 'simpl:OfferingPrice' },
        'simpl:currency': 'EUR',
        'simpl:price': { '@type': 'xsd:decimal', '@value': 10000 },
        'simpl:priceType': 'free',
      },
    };

    const result = credentialSubjectToFormData(credentialSubject);

    expect(result).toEqual({
      'simpl:generalServiceProperties': {
        'simpl:name': 'My Data Offering',
        'simpl:description': 'A test offering',
        'simpl:offeringType': 'data',
        'simpl:serviceAccessPoint': 'https://example.com/api',
      },
      'simpl:dataProperties': {
        'simpl:format': 'csv',
      },
      'simpl:offeringPrice': {
        'simpl:currency': 'EUR',
        'simpl:price': 10000,
        'simpl:priceType': 'free',
      },
    });
  });

  it('should handle null and undefined values', () => {
    expect(credentialSubjectToFormData({ 'simpl:field': null } as any)).toEqual({
      'simpl:field': null,
    });
  });

  it('should return empty object for empty input', () => {
    expect(credentialSubjectToFormData({})).toEqual({});
  });
});
