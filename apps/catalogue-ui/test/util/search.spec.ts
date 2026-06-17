import { describe, it, expect } from 'vitest';
import type { RawSearchAPIResults, APIResponse, SearchAPIResult } from 'types/searchApi';
import { isAPIError, createAPIError, type APIErrorResponse } from '@simpl/vue-components';
import {
  transformSearchResultItems,
  filterAdvancedSearchSchemas,
  transformFormDataToAdvancedSearchRequestBody,
} from '@/util/search';

describe('transform search results by unpacking objects', () => {
  it('should transform raw search results correctly', () => {
    const rawResults: RawSearchAPIResults = {
      items: [
        {
          0: {
            title: 'result1',
            name: 'result1',
            description: 'result1',
            offeringType: 'data',
            claimsGraphUri: ['uri1'],
          },
        },
        {
          0: {
            title: 'result2',
            name: 'result2',
            description: 'result2',
            offeringType: 'data',
            claimsGraphUri: ['uri2'],
          },
        },
      ],
      totalCount: 2,
    };
    const expectedResults: SearchAPIResult[] = [
      {
        title: 'result1',
        name: 'result1',
        description: 'result1',
        offeringType: 'data',
        claimsGraphUri: ['uri1'],
      },
      {
        title: 'result2',
        name: 'result2',
        description: 'result2',
        offeringType: 'data',
        claimsGraphUri: ['uri2'],
      },
    ];
    expect(transformSearchResultItems(rawResults)).toEqual(expectedResults);
  });
});

describe('isAPIError', () => {
  it('should return true for a standard API error response', () => {
    const errorResponse: APIErrorResponse = {
      keyErrorMessage: 'Error',
      response: {
        errorTitle: 'Error Title',
        errorDescription: 'Error Description',
      },
    };
    expect(isAPIError(errorResponse)).toBe(true);
  });

  it('should return false for non-error API response', () => {
    const successResponse: APIResponse<unknown> = {
      data: 'some data',
      error: 'error',
      code: 'code',
    };
    expect(isAPIError(successResponse)).toBe(false);
  });
});

describe('createAPIError', () => {
  it('should create an API error response correctly', () => {
    const keyErrorMessage = 'Error';
    const title = 'Error Title';
    const description = 'Error Description';
    const expectedErrorResponse: APIErrorResponse = {
      keyErrorMessage: keyErrorMessage,
      response: {
        errorTitle: title,
        errorDescription: description,
      },
    };
    expect(createAPIError(keyErrorMessage, title, description)).toEqual(expectedErrorResponse);
  });
});

describe('filterAdvancedSearchSchemas', () => {
  it('should filter advanced search schemas correctly', () => {
    const schemasResponse = {
      Service: ['schema1.ttl', 'schema2.ttl'],
      Dataset: ['schema3.ttl', 'schema4.ttl'],
    };
    const expectedResult = [
      { label: 'schema1', value: 'schema1.ttl' },
      { label: 'schema2', value: 'schema2.ttl' },
    ];
    const result = filterAdvancedSearchSchemas(schemasResponse);
    expect(result).toEqual(expectedResult);
  });
});

describe('transformFormDataToAdvancedSearchRequestBody', () => {
  it('should transform form data to advanced search request body correctly', () => {
    const formData = {
      'schema:Service': {
        'schema:serviceType': { min: 1, max: 10 },
        'schema:serviceName': { min: 5, max: 15 },
      },
      'schema:Dataset': {
        'schema:datasetName': { min: 2, max: 8 },
      },
    };
    const expectedRequestBody = {
      'schema:Service': {
        '@type': 'schema:Service',
        serviceType: { min: 1, max: 10 },
        serviceName: { min: 5, max: 15 },
      },
      'schema:Dataset': {
        '@type': 'schema:Dataset',
        datasetName: { min: 2, max: 8 },
      },
    };
    const result = transformFormDataToAdvancedSearchRequestBody(formData);
    expect(result).toEqual(expectedRequestBody);
  });

  it('should return undefined for empty form data', () => {
    expect(transformFormDataToAdvancedSearchRequestBody({})).toBeUndefined();
    expect(transformFormDataToAdvancedSearchRequestBody(undefined)).toBeUndefined();
    expect(transformFormDataToAdvancedSearchRequestBody(null)).toBeUndefined();
  });
});
