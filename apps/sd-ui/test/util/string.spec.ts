import { describe, it, expect } from 'vitest';
import { capitalizeFirstLetter } from '@/util/string';

describe('capitalizeFirstLetter', () => {
  it('capitalizes the first letter of a lowercase string', () => {
    expect(capitalizeFirstLetter('hello')).toBe('Hello');
  });

  it('returns the string unchanged when it already starts with uppercase', () => {
    expect(capitalizeFirstLetter('Hello')).toBe('Hello');
  });

  it('returns an empty string when given an empty string', () => {
    expect(capitalizeFirstLetter('')).toBe('');
  });

  it('returns falsy input as-is (early return branch)', () => {
    // The implementation returns the value directly when falsy
    expect(capitalizeFirstLetter(null as any)).toBeNull();
    expect(capitalizeFirstLetter(undefined as any)).toBeUndefined();
  });
});
