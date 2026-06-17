import { describe, it, vi, expect, beforeEach } from 'vitest';
import {
  isProblemDetails,
  isProblemDetailsResponse,
  isAPIError,
  createAPIError,
  isAnyError,
  createCustomUIError,
  transformSearchAPIErrorToUIError,
  transformProblemDetailsToUIError,
  transformAnyErrorToUIError,
  createProblemDetailsError,
  createProblemDetailsResponse,
  PROBLEM_DETAILS_CONTENT_TYPE,
} from '@/util/errors';
import type { APIErrorResponse, ProblemDetailsResponse } from 'types/errors';

describe('errors.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isProblemDetails', () => {
    it('returns true for valid problem details object', () => {
      const problemDetails: ProblemDetailsResponse = {
        type: 'https://example.com/problem',
        title: 'Test Problem',
        status: 400,
        detail: 'Test detail',
        instance: '/test/instance',
      };

      expect(isProblemDetails(problemDetails)).toBe(true);
    });

    it('returns true for minimal problem details object', () => {
      const problemDetails = {};
      expect(isProblemDetails(problemDetails)).toBe(true);
    });

    it('returns false for null or undefined', () => {
      expect(isProblemDetails(null)).toBe(false);
      expect(isProblemDetails(undefined)).toBe(false);
    });

    it('returns false for non-object types', () => {
      expect(isProblemDetails('string')).toBe(false);
      expect(isProblemDetails(123)).toBe(false);
      expect(isProblemDetails(true)).toBe(false);
    });

    it('returns false for object with invalid property types', () => {
      const invalidProblem = {
        type: 123, // should be string
        title: true, // should be string
      };
      expect(isProblemDetails(invalidProblem)).toBe(false);
    });
  });

  describe('isProblemDetailsResponse', () => {
    it('returns true when content-type includes application/problem+json', () => {
      const response = {
        headers: {
          get: vi.fn().mockReturnValue('application/problem+json; charset=utf-8'),
        },
      } as unknown as Response;

      expect(isProblemDetailsResponse(response)).toBe(true);
    });

    it('returns false when content-type does not include application/problem+json', () => {
      const response = {
        headers: {
          get: vi.fn().mockReturnValue('application/json'),
        },
      } as unknown as Response;

      expect(isProblemDetailsResponse(response)).toBe(false);
    });

    it('returns false when content-type header is null', () => {
      const response = {
        headers: {
          get: vi.fn().mockReturnValue(null),
        },
      } as unknown as Response;

      expect(isProblemDetailsResponse(response)).toBe(false);
    });
  });

  describe('isAPIError', () => {
    it('returns true for valid API error response', () => {
      const apiError: APIErrorResponse = {
        keyErrorMessage: 'TEST_ERROR',
        response: {
          errorTitle: 'Test Title',
          errorDescription: 'Test Description',
        },
      };

      expect(isAPIError(apiError)).toBe(true);
    });

    it('returns false for incomplete API error response', () => {
      const incompleteError = {
        keyErrorMessage: 'TEST_ERROR',
        // missing response object
      };

      expect(isAPIError(incompleteError)).toBe(false);
    });

    it('returns false for non-API error objects', () => {
      const nonError = { someOtherProperty: 'value' };
      expect(isAPIError(nonError)).toBe(false);
    });
  });

  describe('createAPIError', () => {
    it('creates a properly formatted API error', () => {
      const result = createAPIError('TEST_ERROR', 'Test Title', 'Test Description');

      expect(result).toEqual({
        keyErrorMessage: 'TEST_ERROR',
        response: {
          errorTitle: 'Test Title',
          errorDescription: 'Test Description',
        },
      });
    });
  });

  describe('isAnyError', () => {
    it('returns true when response is not ok', () => {
      const response = { ok: false } as Response;
      expect(isAnyError(response)).toBe(true);
    });

    it('returns true when response has problem details content type', () => {
      const response = {
        ok: true,
        headers: {
          get: vi.fn().mockReturnValue('application/problem+json'),
        },
      } as unknown as Response;

      expect(isAnyError(response)).toBe(true);
    });

    it('returns true when data is an API error', () => {
      const response = {
        ok: true,
        headers: { get: vi.fn().mockReturnValue(null) },
      } as unknown as Response;
      const apiError: APIErrorResponse = {
        keyErrorMessage: 'TEST_ERROR',
        response: { errorTitle: 'Title', errorDescription: 'Description' },
      };

      expect(isAnyError(response, apiError)).toBe(true);
    });

    it('returns false when response is ok and no errors', () => {
      const response = {
        ok: true,
        headers: { get: vi.fn().mockReturnValue('application/json') },
      } as unknown as Response;

      expect(isAnyError(response, {})).toBe(false);
    });
  });

  describe('createCustomUIError', () => {
    it('creates UI error without API name and error identifier', () => {
      const result = createCustomUIError('Test Title', 'Test Description');

      expect(result).toEqual({
        title: 'Test Title',
        description: 'Test Description',
      });
    });

    it('creates UI error with API name', () => {
      const result = createCustomUIError('Test Title', 'Test Description', 'TestAPI');

      expect(result).toEqual({
        title: 'TestAPI API: Test Title',
        description: 'Test Description',
      });
    });

    it('creates UI error with error identifier', () => {
      const result = createCustomUIError('Test Title', 'Test Description', undefined, 'TEST_ERROR');

      expect(result).toEqual({
        title: 'Test Title',
        description: 'Test Description (TEST_ERROR)',
      });
    });

    it('creates UI error with all parameters', () => {
      const result = createCustomUIError(
        'Test Title',
        'Test Description',
        'TestAPI',
        'TEST_ERROR',
        400
      );

      expect(result).toEqual({
        title: 'TestAPI API: Test Title',
        description: 'Test Description (TEST_ERROR)',
        status: 400,
      });
    });
  });

  describe('transformSearchAPIErrorToUIError', () => {
    it('transforms API error to UI error', () => {
      const apiError: APIErrorResponse = {
        keyErrorMessage: 'TEST_ERROR',
        response: {
          errorTitle: 'API Error Title',
          errorDescription: 'API Error Description',
        },
      };

      const result = transformSearchAPIErrorToUIError(apiError, 'SearchAPI', 'SEARCH_ERROR');

      expect(result).toEqual({
        title: 'SearchAPI API: API Error Title',
        description: 'API Error Description (SEARCH_ERROR)',
      });
    });
  });

  describe('transformProblemDetailsToUIError', () => {
    it('transforms problem details to UI error', () => {
      const problemDetails: ProblemDetailsResponse = {
        type: 'https://example.com/problem',
        title: 'Problem Title',
        status: 400,
        detail: 'Problem Detail',
      };

      const result = transformProblemDetailsToUIError(
        problemDetails,
        'ProblemAPI',
        'PROBLEM_ERROR'
      );

      expect(result).toEqual({
        title: 'ProblemAPI API: Problem Title',
        description: 'Problem Detail (PROBLEM_ERROR)',
        status: 400,
      });
    });

    it('uses default values for missing title and detail', () => {
      const problemDetails: ProblemDetailsResponse = {};

      const result = transformProblemDetailsToUIError(problemDetails);

      expect(result).toEqual({
        title: 'An error occurred',
        description: 'Error details are not available',
      });
    });

    it('extracts detail from issues array when present', () => {
      const problemDetails: ProblemDetailsResponse = {
        title: 'Remote Asset Orchestrator Error',
        status: 400,
        detail: 'remote endpoint invocation error',
        issues: [
          {
            detail: 'YAML configuration is invalid. Errors: [some validation error]',
          },
        ],
      };

      const result = transformProblemDetailsToUIError(problemDetails, 'TestAPI', 'TEST_ERROR');

      expect(result).toEqual({
        title: 'TestAPI API: Remote Asset Orchestrator Error',
        description:
          'YAML configuration is invalid. Errors: [some validation error] (TEST_ERROR)',
        status: 400,
      });
    });

    it('joins multiple issue details with semicolons', () => {
      const problemDetails: ProblemDetailsResponse = {
        title: 'Validation Error',
        status: 400,
        detail: 'multiple errors',
        issues: [
          { detail: 'Field A is required' },
          { detail: 'Field B must be a number' },
        ],
      };

      const result = transformProblemDetailsToUIError(problemDetails);

      expect(result).toEqual({
        title: 'Validation Error',
        description: 'Field A is required; Field B must be a number',
        status: 400,
      });
    });

    it('falls back to detail when issues array is empty', () => {
      const problemDetails: ProblemDetailsResponse = {
        title: 'Error',
        status: 400,
        detail: 'fallback detail message',
        issues: [],
      };

      const result = transformProblemDetailsToUIError(problemDetails);

      expect(result).toEqual({
        title: 'Error',
        description: 'fallback detail message',
        status: 400,
      });
    });

    it('falls back to detail when issues have no detail property', () => {
      const problemDetails: ProblemDetailsResponse = {
        title: 'Error',
        status: 400,
        detail: 'fallback detail',
        issues: [
          { type: 'some-type', title: 'some title' },
        ],
      };

      const result = transformProblemDetailsToUIError(problemDetails);

      expect(result).toEqual({
        title: 'Error',
        description: 'fallback detail',
        status: 400,
      });
    });

    it('filters out issues without detail and joins remaining', () => {
      const problemDetails: ProblemDetailsResponse = {
        title: 'Error',
        status: 400,
        detail: 'should not be used',
        issues: [
          { detail: 'First error' },
          { type: 'no-detail-here' },
          { detail: 'Third error' },
        ],
      };

      const result = transformProblemDetailsToUIError(problemDetails);

      expect(result).toEqual({
        title: 'Error',
        description: 'First error; Third error',
        status: 400,
      });
    });

    it('uses detail when issues is undefined', () => {
      const problemDetails: ProblemDetailsResponse = {
        title: 'Error',
        status: 500,
        detail: 'Something went wrong',
      };

      const result = transformProblemDetailsToUIError(problemDetails);

      expect(result).toEqual({
        title: 'Error',
        description: 'Something went wrong',
        status: 500,
      });
    });
  });

  describe('transformAnyErrorToUIError', () => {
    it('transforms API error using search API transformer', () => {
      const apiError: APIErrorResponse = {
        keyErrorMessage: 'TEST_ERROR',
        response: {
          errorTitle: 'API Title',
          errorDescription: 'API Description',
        },
      };

      const result = transformAnyErrorToUIError(apiError, 'TestAPI', 'TEST_ERROR');

      expect(result).toEqual({
        title: 'TestAPI API: API Title',
        description: 'API Description (TEST_ERROR)',
      });
    });

    it('transforms problem details using problem details transformer', () => {
      const problemDetails: ProblemDetailsResponse = {
        title: 'Problem Title',
        detail: 'Problem Detail',
      };

      const result = transformAnyErrorToUIError(problemDetails, 'TestAPI', 'PROBLEM_ERROR');

      expect(result).toEqual({
        title: 'TestAPI API: Problem Title',
        description: 'Problem Detail (PROBLEM_ERROR)',
      });
    });

    it('returns unknown error for unrecognized error types', () => {
      const unknownError = { someProperty: 'value' } as any;

      const result = transformAnyErrorToUIError(unknownError, 'TestAPI', 'UNKNOWN_ERROR');

      expect(result).toEqual({
        title: 'TestAPI API: An error occurred',
        description: 'Error details are not available (UNKNOWN_ERROR)',
      });
    });

    it('returns unknown error for non-object error types', () => {
      const stringError = 'some error string' as any;

      const result = transformAnyErrorToUIError(stringError, 'TestAPI', 'UNKNOWN_ERROR');

      expect(result).toEqual({
        title: 'TestAPI API: Error',
        description: 'some error string (UNKNOWN_ERROR)',
      });
    });
  });

  describe('createProblemDetailsError', () => {
    it('creates problem details with all parameters', () => {
      const result = createProblemDetailsError(
        'https://example.com/problem',
        'Test Problem',
        400,
        'Test Detail',
        '/test/instance'
      );

      expect(result).toEqual({
        type: 'https://example.com/problem',
        title: 'Test Problem',
        status: 400,
        detail: 'Test Detail',
        instance: '/test/instance',
      });
    });

    it('creates minimal problem details with defaults', () => {
      const result = createProblemDetailsError();

      expect(result).toEqual({
        type: 'about:blank',
      });
    });

    it('omits undefined optional parameters', () => {
      const result = createProblemDetailsError('https://example.com/problem', 'Title');

      expect(result).toEqual({
        type: 'https://example.com/problem',
        title: 'Title',
      });
    });
  });

  describe('createProblemDetailsResponse', () => {
    it('creates Response with problem details and correct headers', () => {
      const result = createProblemDetailsResponse(
        'https://example.com/problem',
        'Test Problem',
        400,
        'Test Detail'
      );

      expect(result).toBeInstanceOf(Response);
      expect(result.status).toBe(400);
      expect(result.headers.get('Content-Type')).toBe(PROBLEM_DETAILS_CONTENT_TYPE);
    });

    it('defaults to status 500 when not provided', () => {
      const result = createProblemDetailsResponse('https://example.com/problem', 'Test Problem');

      expect(result.status).toBe(500);
    });

    it('creates response with correct JSON body', async () => {
      const result = createProblemDetailsResponse(
        'https://example.com/problem',
        'Test Problem',
        400,
        'Test Detail'
      );

      const body = await result.json();
      expect(body).toEqual({
        type: 'https://example.com/problem',
        title: 'Test Problem',
        status: 400,
        detail: 'Test Detail',
      });
    });
  });
});
