import type { AdvancedSearchNumberRangeValue, APIErrorResponse } from '@simpl/vue-components';

export interface RawSearchAPIResults<T = SearchAPIResult> {
  items: { [key: string]: T }[];
  totalCount: number;
}

export interface SearchAPIResults<T = SearchAPIResult> {
  items: T[];
  totalCount: number;
}

export interface ShapesListCategorized {
  Service: string[];
  [key: string]: string[];
}

export type APIResponse<T> = T | APIErrorResponse;

export interface SearchAPISelfDescriptionDocument {
  '@context': string[];
  credentialSubject: Record<string, unknown>;
  issuanceDate: string;
  issuer: string;
  proof: {
    created: string;
    jws: string;
    proofPurpose: string;
    type: string;
    verificationMethod: string;
  };
  type: string;
}

export interface SearchAPIResult {
  title?: string;
  name?: string;
  description?: string;
  offeringType: string;
  [key: string]: unknown;
  claimsGraphUri: [string];
}

export type SearchSchemasCategorized = Record<string, string[]>;

export type SearchAdvancedBodySection = {
  '@type': string;
  [key: string]: string | AdvancedSearchNumberRangeValue;
};

export type SearchAdvancedRequestBody = {
  [key: string]: SearchAdvancedBodySection;
};
