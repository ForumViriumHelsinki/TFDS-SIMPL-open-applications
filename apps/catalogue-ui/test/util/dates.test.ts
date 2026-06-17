import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatDate,
  formatDateTime,
  formatTimeConditional,
  formatElapsedTime,
} from '../../src/util/dates';

describe('dates', () => {
  describe('formatDate', () => {
    beforeEach(() => {
      // Mock the locale to ensure consistent test results
      vi.spyOn(Intl, 'DateTimeFormat').mockImplementation((locale, options) => {
        return new Intl.DateTimeFormat('en-US', options);
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should format ISO date string in long format', () => {
      const result = formatDate('2020-01-01T00:00:00Z');
      expect(result).toBe('January 1, 2020');
    });

    it('should format another ISO date string', () => {
      const result = formatDate('2030-12-25T15:30:45Z');
      expect(result).toBe('December 25, 2030');
    });

    it('should handle date without time component', () => {
      const result = formatDate('2025-07-22');
      expect(result).toBe('July 22, 2025');
    });

    it('should return Invalid Date on invalid date', () => {
      const invalidDate = 'not-a-date';
      const result = formatDate(invalidDate);
      expect(result).toBe('Invalid Date');
    });

    it('should return Invalid Date on empty string', () => {
      const result = formatDate('');
      expect(result).toBe('Invalid Date');
    });

    it('should handle edge case dates', () => {
      const result = formatDate('1970-01-01T00:00:00Z');
      expect(result).toBe('January 1, 1970');
    });

    it('should handle locale parameter', () => {
      const result = formatDate('2025-01-01T00:00:00Z', 'en-US');
      expect(result).toBe('January 1, 2025');
    });

    it('should return original string when toLocaleDateString throws error', () => {
      // Mock toLocaleDateString to throw an error
      const mockDate = new Date('2025-01-01T00:00:00Z');
      vi.spyOn(mockDate, 'toLocaleDateString').mockImplementation(() => {
        throw new Error('Locale error');
      });

      // Mock Date constructor to return our mock
      vi.spyOn(global, 'Date').mockImplementationOnce(() => mockDate);

      const result = formatDate('2025-01-01T00:00:00Z');
      expect(result).toBe('2025-01-01T00:00:00Z');
    });
  });

  describe('formatDateTime', () => {
    it('should format date string with time', () => {
      const result = formatDateTime('2020-01-01T15:30:00Z');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should format Date object with time', () => {
      const date = new Date('2025-12-25T09:15:45Z');
      const result = formatDateTime(date);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should format timestamp number with time', () => {
      const timestamp = 1609459800000; // 2021-01-01T00:30:00Z
      const result = formatDateTime(timestamp);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return string representation on invalid input', () => {
      const result = formatDateTime('invalid-date');
      expect(result).toBe('invalid-date');
    });

    it('should handle empty string input', () => {
      const result = formatDateTime('');
      expect(result).toBe('');
    });
  });

  describe('formatTimeConditional', () => {
    it('should handle valid date string', () => {
      const result = formatTimeConditional('2025-08-28T10:30:00Z');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle Date object', () => {
      const date = new Date('2025-08-28T16:45:00Z');
      const result = formatTimeConditional(date);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle timestamp', () => {
      const timestamp = new Date('2025-08-29T08:15:00Z').getTime();
      const result = formatTimeConditional(timestamp);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return string representation on invalid input', () => {
      const result = formatTimeConditional('invalid-date');
      expect(result).toBe('invalid-date');
    });

    it('should handle empty string input', () => {
      const result = formatTimeConditional('');
      expect(result).toBe('');
    });
  });

  describe('formatElapsedTime', () => {
    it('should handle valid date range', () => {
      const start = '2025-08-28T10:00:00Z';
      const end = '2025-08-28T10:00:30Z';
      const result = formatElapsedTime(start, end);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should use current time when endTime not provided', () => {
      const start = new Date(Date.now() - 60000).toISOString(); // 1 minute ago
      const result = formatElapsedTime(start);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle Date objects', () => {
      const start = new Date('2025-08-28T10:00:00Z');
      const end = new Date('2025-08-28T10:02:30Z');
      const result = formatElapsedTime(start, end);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle timestamps', () => {
      const start = new Date('2025-08-28T10:00:00Z').getTime();
      const end = new Date('2025-08-28T10:00:45Z').getTime();
      const result = formatElapsedTime(start, end);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return error message for negative time range', () => {
      const start = '2025-08-28T10:00:00Z';
      const end = '2025-08-28T09:00:00Z'; // Earlier than start
      const result = formatElapsedTime(start, end);
      expect(result).toBe('Invalid time range');
    });

    it('should return error message on invalid input', () => {
      const result = formatElapsedTime('invalid-date', '2025-08-28T10:00:00Z');
      expect(result).toBe('Invalid time');
    });

    it('should handle edge case of zero time difference', () => {
      const start = '2025-08-28T10:00:00Z';
      const end = '2025-08-28T10:00:00Z';
      const result = formatElapsedTime(start, end);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle custom locale parameter', () => {
      const start = '2025-08-28T10:00:00Z';
      const end = '2025-08-28T10:00:30Z';
      const result = formatElapsedTime(start, end, 'en-US');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
