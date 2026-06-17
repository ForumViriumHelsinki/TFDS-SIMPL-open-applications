import { describe, it, expect } from 'vitest';
import {
  accessPolicyFieldName,
  usagePolicyFieldName,
  servicePolicyFieldName,
} from '@/util/ttlParser/renderers';
import { accessPolicyTester, usagePolicyTester } from '@/util/ttlParser/testers';

describe('ttlParser renderers constants', () => {
  it('exports the correct accessPolicyFieldName', () => {
    expect(accessPolicyFieldName).toBe('simpl:access-policy');
  });

  it('exports the correct usagePolicyFieldName', () => {
    expect(usagePolicyFieldName).toBe('simpl:usage-policy');
  });

  it('exports the correct servicePolicyFieldName', () => {
    expect(servicePolicyFieldName).toBe('simpl:servicePolicy');
  });
});

describe('ttlParser testers', () => {
  it('accessPolicyTester returns high rank for scopes ending with the access policy field name', () => {
    const schema = {};
    const uiSchema = { scope: `#/properties/${accessPolicyFieldName}` };
    const ctx = {} as any;
    expect(accessPolicyTester(uiSchema as any, schema as any, ctx)).toBeGreaterThan(0);
  });

  it('accessPolicyTester returns -1 for non-matching scopes', () => {
    const uiSchema = { scope: '#/properties/other' };
    expect(accessPolicyTester(uiSchema as any, {} as any, {} as any)).toBe(-1);
  });

  it('usagePolicyTester returns high rank for scopes ending with the usage policy field name', () => {
    const uiSchema = { scope: `#/properties/${usagePolicyFieldName}` };
    expect(usagePolicyTester(uiSchema as any, {} as any, {} as any)).toBeGreaterThan(0);
  });

  it('usagePolicyTester returns -1 for non-matching scopes', () => {
    const uiSchema = { scope: '#/properties/other' };
    expect(usagePolicyTester(uiSchema as any, {} as any, {} as any)).toBe(-1);
  });
});
