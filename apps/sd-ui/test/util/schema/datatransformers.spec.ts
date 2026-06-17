import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { transformData } from '@/util/schema/datatransformers';
import { getAccessPolicyJsonLd, getUsagePolicyJsonLd } from '@/services/sdtooling';

vi.mock('@/util/getEnv', () => ({
  getPublicEnv: vi.fn(() => ({
    PUBLIC_AUTH_KEYCLOAK_SERVER_URL: 'http://keycloak',
    PUBLIC_AUTH_KEYCLOAK_CLIENT_ID: 'clientId',
    PUBLIC_AUTH_KEYCLOAK_REALM: 'realm',
  })),
}));

vi.mock('@/services/sdtooling', () => ({
  getAccessPolicyJsonLd: vi.fn(),
  getUsagePolicyJsonLd: vi.fn(),
}));

describe('transformData', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('transforms access and usage policy data when present and responses are ok', async () => {
    const schemaData = {
      'simpl:servicePolicy': {
        'simpl:access-policy': JSON.stringify([{ foo: 'bar' }]),
        'simpl:usage-policy': JSON.stringify([{ baz: 'qux' }]),
      },
    };
    const id = 'resource-id';
    const token = 'token';

    (getAccessPolicyJsonLd as Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        access: 'ok',
      }),
    });
    (getUsagePolicyJsonLd as Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        usage: 'ok',
      }),
    });

    const result = await transformData(schemaData, id, token);

    expect(result['simpl:servicePolicy']['simpl:access-policy']).toBe(
      JSON.stringify({ access: 'ok' })
    );
    expect(result['simpl:servicePolicy']['simpl:usage-policy']).toBe(
      JSON.stringify({ usage: 'ok' })
    );
  });

  it('throws an error if access policy response is not ok', async () => {
    const schemaData = {
      'simpl:servicePolicy': {
        'simpl:access-policy': JSON.stringify([{ foo: 'bar' }]),
      },
    };

    const id = 'resource-id';
    const token = 'token';

    (getAccessPolicyJsonLd as Mock).mockResolvedValue({
      ok: false,
      json: async () => ({
        response: {
          errorTitle: 'Access Policy Error',
          errorMessage: 'Failed to fetch access policy',
        },
      }),
    });

    await expect(transformData(schemaData, id, token)).rejects.toThrow(
      'Failed to fetch access policy'
    );
  });

  it('throws an error if usage policy response is not ok', async () => {
    const schemaData = {
      'simpl:servicePolicy': {
        'simpl:usage-policy': JSON.stringify([{ baz: 'qux' }]),
      },
    };

    const id = 'resource-id';
    const token = 'token';

    (getUsagePolicyJsonLd as Mock).mockResolvedValue({
      ok: false,
      json: async () => ({
        response: {
          errorTitle: 'Usage Policy Error',
          errorMessage: 'Failed to fetch usage policy',
        },
      }),
    });

    await expect(transformData(schemaData, id, token)).rejects.toThrow(
      'Failed to fetch usage policy'
    );
  });
});
