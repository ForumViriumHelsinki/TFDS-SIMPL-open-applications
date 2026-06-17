import { describe, it, expect } from 'vitest';
import { isValidSimplSDSchemaUIVariant } from '@/util/ttlParser/util';

describe('isValidSimplSDSchemaUIVariant', () => {
  it('returns true for valid SimplSDSchemaUIVariant values', () => {
    expect(isValidSimplSDSchemaUIVariant('default')).toBe(true);
    expect(isValidSimplSDSchemaUIVariant('sdCreation')).toBe(true);
    expect(isValidSimplSDSchemaUIVariant('advancedSearch')).toBe(true);
  });

  it('returns false for invalid SimplSDSchemaUIVariant values', () => {
    expect(isValidSimplSDSchemaUIVariant('invalidValue')).toBe(false);
    expect(isValidSimplSDSchemaUIVariant('')).toBe(false);
    expect(isValidSimplSDSchemaUIVariant('default ')).toBe(false); // Extra space
    expect(isValidSimplSDSchemaUIVariant('advancedsearch')).toBe(false); // Case-sensitive
  });
});
