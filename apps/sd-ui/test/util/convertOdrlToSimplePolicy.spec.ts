import { describe, it, expect } from 'vitest';
import {
  convertOdrlAccessPolicy,
  convertOdrlUsagePolicy,
  convertServicePolicyOdrlToSimpleFormat,
} from '@/util/convertOdrlToSimplePolicy';

describe('convertOdrlAccessPolicy', () => {
  it('converts ODRL access policy with date constraints to simple format', () => {
    const odrl = JSON.stringify({
      profile: 'http://www.w3.org/ns/odrl/2/odrl.jsonld',
      target: 'b8969c62-cf82-4f45-89e9-5db7531b5ae5',
      assigner: { uid: 'provider', role: 'http://www.w3.org/ns/odrl/2/assigner' },
      uid: 'e49aa631-9912-42c6-989f-c2b9634db561',
      '@context': 'http://www.w3.org/ns/odrl.jsonld',
      '@type': 'Set',
      permission: [
        {
          target: 'b8969c62-cf82-4f45-89e9-5db7531b5ae5',
          assignee: { uid: 'RESEARCHER', role: 'http://www.w3.org/ns/odrl/2/assignee' },
          action: ['http://simpl.eu/odrl/actions/consume'],
          constraint: [
            {
              leftOperand: 'http://www.w3.org/ns/odrl/2/dateTime',
              operator: 'http://www.w3.org/ns/odrl/2/gteq',
              rightOperand: '2025-06-01T08:01:02Z',
            },
            {
              leftOperand: 'http://www.w3.org/ns/odrl/2/dateTime',
              operator: 'http://www.w3.org/ns/odrl/2/lteq',
              rightOperand: '2026-08-31T08:02:19Z',
            },
          ],
        },
      ],
    });

    const result = JSON.parse(convertOdrlAccessPolicy(odrl));

    expect(result).toEqual([
      {
        assignee: 'RESEARCHER',
        action: 'CONSUME',
        fromDatetime: '2025-06-01T08:01:02Z',
        toDatetime: '2026-08-31T08:02:19Z',
      },
    ]);
  });

  it('converts ODRL access policy without constraints', () => {
    const odrl = JSON.stringify({
      '@context': 'http://www.w3.org/ns/odrl.jsonld',
      '@type': 'Set',
      permission: [
        {
          assignee: { uid: 'CONSUMER', role: 'http://www.w3.org/ns/odrl/2/assignee' },
          action: ['http://simpl.eu/odrl/actions/search'],
          constraint: [],
        },
      ],
    });

    const result = JSON.parse(convertOdrlAccessPolicy(odrl));

    expect(result).toEqual([
      {
        assignee: 'CONSUMER',
        action: 'SEARCH',
      },
    ]);
  });

  it('converts ODRL access policy with multiple permissions', () => {
    const odrl = JSON.stringify({
      '@type': 'Set',
      permission: [
        {
          assignee: { uid: 'RESEARCHER' },
          action: ['http://simpl.eu/odrl/actions/consume'],
          constraint: [
            {
              leftOperand: 'http://www.w3.org/ns/odrl/2/dateTime',
              operator: 'http://www.w3.org/ns/odrl/2/gteq',
              rightOperand: '2025-01-01T00:00:00Z',
            },
          ],
        },
        {
          assignee: { uid: 'DATA_PROVIDER' },
          action: ['http://simpl.eu/odrl/actions/search'],
          constraint: [],
        },
      ],
    });

    const result = JSON.parse(convertOdrlAccessPolicy(odrl));

    expect(result).toHaveLength(2);
    expect(result[0].assignee).toBe('RESEARCHER');
    expect(result[0].fromDatetime).toBe('2025-01-01T00:00:00Z');
    expect(result[0].action).toBe('CONSUME');
    expect(result[1].assignee).toBe('DATA_PROVIDER');
    expect(result[1].fromDatetime).toBeUndefined();
    expect(result[1].action).toBe('SEARCH');
  });

  it('normalises action in simple format', () => {
    const simple =
      '[{"assignee":"RESEARCHER","action":"consume","fromDatetime":"2025-06-01T08:01:02Z"}]';

    const result = JSON.parse(convertOdrlAccessPolicy(simple));
    expect(result[0].action).toBe('CONSUME');
  });

  it('returns simple format with uppercase action unchanged', () => {
    const simple =
      '[{"assignee":"RESEARCHER","action":"CONSUME","fromDatetime":"2025-06-01T08:01:02Z"}]';

    expect(convertOdrlAccessPolicy(simple)).toBe(simple);
  });

  it('returns non-JSON string unchanged', () => {
    expect(convertOdrlAccessPolicy('not-json')).toBe('not-json');
  });

  it('returns non-ODRL object string unchanged', () => {
    const obj = JSON.stringify({ foo: 'bar' });
    expect(convertOdrlAccessPolicy(obj)).toBe(obj);
  });
});

describe('convertOdrlUsagePolicy', () => {
  it('converts ODRL usage policy with all constraint types', () => {
    const odrl = JSON.stringify({
      '@context': 'http://www.w3.org/ns/odrl.jsonld',
      '@type': 'Set',
      permission: [
        {
          assignee: { uid: 'APP_PROVIDER_PUBLISHER' },
          action: ['http://www.w3.org/ns/odrl/2/use'],
          constraint: [
            {
              leftOperand: 'http://www.w3.org/ns/odrl/2/count',
              operator: 'http://www.w3.org/ns/odrl/2/lteq',
              rightOperand: '100',
            },
            {
              leftOperand: 'http://www.w3.org/ns/odrl/2/deletion',
              operator: 'http://www.w3.org/ns/odrl/2/eq',
              rightOperand: 'after_use',
            },
            {
              leftOperand: 'http://www.w3.org/ns/odrl/2/dateTime',
              operator: 'http://www.w3.org/ns/odrl/2/gteq',
              rightOperand: '2025-11-09T09:02:38Z',
            },
            {
              leftOperand: 'http://www.w3.org/ns/odrl/2/dateTime',
              operator: 'http://www.w3.org/ns/odrl/2/lteq',
              rightOperand: '2026-12-31T09:02:41Z',
            },
          ],
        },
      ],
    });

    const result = JSON.parse(convertOdrlUsagePolicy(odrl));

    expect(result).toEqual([
      {
        assignee: 'APP_PROVIDER_PUBLISHER',
        action: 'USE',
        constraints: [
          { type: 'RestrictedNumber', assignee: 'APP_PROVIDER_PUBLISHER', maxCount: 100 },
          { type: 'Deletion', assignee: 'APP_PROVIDER_PUBLISHER', afterUse: true },
          {
            type: 'RestrictedDuration',
            assignee: 'APP_PROVIDER_PUBLISHER',
            fromDatetime: '2025-11-09T09:02:38Z',
            toDatetime: '2026-12-31T09:02:41Z',
          },
        ],
      },
    ]);
  });

  it('converts ODRL usage policy with only count constraint', () => {
    const odrl = JSON.stringify({
      '@type': 'Set',
      permission: [
        {
          assignee: { uid: 'CONSUMER' },
          action: ['http://www.w3.org/ns/odrl/2/use'],
          constraint: [
            {
              leftOperand: 'http://www.w3.org/ns/odrl/2/count',
              operator: 'http://www.w3.org/ns/odrl/2/lteq',
              rightOperand: '5',
            },
          ],
        },
      ],
    });

    const result = JSON.parse(convertOdrlUsagePolicy(odrl));

    expect(result).toEqual([
      {
        assignee: 'CONSUMER',
        action: 'USE',
        constraints: [{ type: 'RestrictedNumber', assignee: 'CONSUMER', maxCount: 5 }],
      },
    ]);
  });

  it('normalises action URI in simple format', () => {
    const simple =
      '[{"assignee":"APP_PROVIDER_PUBLISHER","action":"http://www.w3.org/ns/odrl/2/use","constraints":[{"type":"RestrictedNumber","assignee":"APP_PROVIDER_PUBLISHER","maxCount":1}]}]';

    const result = JSON.parse(convertOdrlUsagePolicy(simple));
    expect(result[0].action).toBe('USE');
  });

  it('returns simple format with short action unchanged', () => {
    const simple =
      '[{"assignee":"APP_PROVIDER_PUBLISHER","action":"USE","constraints":[{"type":"RestrictedNumber","assignee":"APP_PROVIDER_PUBLISHER","maxCount":1}]}]';

    expect(convertOdrlUsagePolicy(simple)).toBe(simple);
  });

  it('returns non-JSON string unchanged', () => {
    expect(convertOdrlUsagePolicy('not-json')).toBe('not-json');
  });
});

describe('convertServicePolicyOdrlToSimpleFormat', () => {
  it('converts ODRL policies inside simpl:servicePolicy', () => {
    const accessOdrl = JSON.stringify({
      '@type': 'Set',
      permission: [
        {
          assignee: { uid: 'RESEARCHER' },
          action: ['http://simpl.eu/odrl/actions/consume'],
          constraint: [],
        },
      ],
    });

    const usageOdrl = JSON.stringify({
      '@type': 'Set',
      permission: [
        {
          assignee: { uid: 'CONSUMER' },
          action: ['http://www.w3.org/ns/odrl/2/use'],
          constraint: [
            {
              leftOperand: 'http://www.w3.org/ns/odrl/2/count',
              operator: 'http://www.w3.org/ns/odrl/2/lteq',
              rightOperand: '10',
            },
          ],
        },
      ],
    });

    const formData = {
      'simpl:generalServiceProperties': { 'simpl:name': 'Test' },
      'simpl:servicePolicy': {
        'simpl:access-policy': accessOdrl,
        'simpl:usage-policy': usageOdrl,
        'simpl:dataProtectionRegime': 'GDPR',
      },
    };

    const result = convertServicePolicyOdrlToSimpleFormat(formData);

    const sp = result['simpl:servicePolicy'] as Record<string, unknown>;
    expect(JSON.parse(sp['simpl:access-policy'] as string)).toEqual([
      { assignee: 'RESEARCHER', action: 'CONSUME' },
    ]);
    expect(JSON.parse(sp['simpl:usage-policy'] as string)).toEqual([
      {
        assignee: 'CONSUMER',
        action: 'USE',
        constraints: [{ type: 'RestrictedNumber', assignee: 'CONSUMER', maxCount: 10 }],
      },
    ]);
    expect(sp['simpl:dataProtectionRegime']).toBe('GDPR');
    // Other top-level data should be preserved
    expect(result['simpl:generalServiceProperties']).toEqual({ 'simpl:name': 'Test' });
  });

  it('returns data unchanged when simpl:servicePolicy is missing', () => {
    const formData = { 'simpl:generalServiceProperties': { 'simpl:name': 'Test' } };
    expect(convertServicePolicyOdrlToSimpleFormat(formData)).toBe(formData);
  });

  it('returns data unchanged when policies are already in simple format', () => {
    const formData = {
      'simpl:servicePolicy': {
        'simpl:access-policy': '[{"assignee":"X","action":"READ"}]',
        'simpl:usage-policy': '[{"assignee":"X","action":"USE","constraints":[]}]',
      },
    };
    expect(convertServicePolicyOdrlToSimpleFormat(formData)).toBe(formData);
  });

  it('does not mutate the original data', () => {
    const accessOdrl = JSON.stringify({
      '@type': 'Set',
      permission: [{ assignee: { uid: 'A' }, action: ['act'], constraint: [] }],
    });

    const formData = {
      'simpl:servicePolicy': {
        'simpl:access-policy': accessOdrl,
      },
    };

    const original = JSON.parse(JSON.stringify(formData));
    convertServicePolicyOdrlToSimpleFormat(formData);

    expect(formData).toEqual(original);
  });
});
