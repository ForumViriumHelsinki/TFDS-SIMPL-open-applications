import { describe, it, expect } from 'vitest';
import { normalizePrefillToSchema } from '@/util/normalizePrefillToSchema';

describe('normalizePrefillToSchema', () => {
  it('keeps exact matching keys unchanged', () => {
    const schema = {
      type: 'object',
      properties: {
        'simpl:generalServiceProperties': {
          type: 'object',
          properties: {
            'simpl:name': { type: 'string' },
          },
        },
      },
    };

    const prefill = {
      'simpl:generalServiceProperties': {
        'simpl:name': 'Example name',
      },
    };

    expect(normalizePrefillToSchema(prefill, schema)).toEqual(prefill);
  });

  it('maps prefixed keys to non-prefixed schema keys by local name', () => {
    const schema = {
      type: 'object',
      properties: {
        generalServiceProperties: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            serviceAccessPoint: { type: 'string' },
          },
        },
      },
    };

    const prefill = {
      'simpl:generalServiceProperties': {
        'simpl:name': 'My offering',
        'simpl:serviceAccessPoint': 'https://example.com',
      },
    };

    expect(normalizePrefillToSchema(prefill, schema)).toEqual({
      generalServiceProperties: {
        name: 'My offering',
        serviceAccessPoint: 'https://example.com',
      },
    });
  });

  it('wraps payload under single schema root key when needed', () => {
    const schema = {
      type: 'object',
      properties: {
        DataOfferingShape: {
          type: 'object',
          properties: {
            'simpl:generalServiceProperties': {
              type: 'object',
              properties: {
                'simpl:name': { type: 'string' },
              },
            },
          },
        },
      },
    };

    const prefill = {
      'simpl:generalServiceProperties': {
        'simpl:name': 'Data one',
      },
    };

    expect(normalizePrefillToSchema(prefill, schema)).toEqual({
      DataOfferingShape: {
        'simpl:generalServiceProperties': {
          'simpl:name': 'Data one',
        },
      },
    });
  });
});
