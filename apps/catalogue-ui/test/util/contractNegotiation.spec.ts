import { describe, it, expect, vi } from 'vitest';
import {
  isEligibleForContractNegotiation,
  getContractNegotiationData,
  humanizeContractNegotiationStatus,
} from '@/util/contractNegotiation';
import type { ContractNegotiationStatusResponse } from 'types/contracts';
import type { SearchAPISelfDescriptionDocument } from 'types/searchApi';

// Mock the dates utility
vi.mock('@/util/dates', () => ({
  formatDateTime: vi.fn((date) => `formatted-${date}`),
}));

// Helper function to create a base document structure
const createBaseDocument = (credentialSubject: any): SearchAPISelfDescriptionDocument => ({
  '@context': ['http://example.com'],
  credentialSubject,
  issuanceDate: '2021-01-01',
  issuer: 'test-issuer',
  proof: {
    created: '2021-01-01',
    jws: 'test-jws',
    proofPurpose: 'test-purpose',
    type: 'test-type',
    verificationMethod: 'test-method',
  },
  type: 'test-type',
});

describe('contractNegotiation.ts', () => {
  describe('isEligibleForContractNegotiation', () => {
    it('returns false when resourceDescriptionDocument is null or undefined', () => {
      expect(isEligibleForContractNegotiation(null as any)).toBe(false);
      expect(isEligibleForContractNegotiation(undefined as any)).toBe(false);
    });

    it('returns false when credentialSubject is missing', () => {
      const document = {} as SearchAPISelfDescriptionDocument;
      expect(isEligibleForContractNegotiation(document)).toBe(false);
    });

    it('returns false when assetId is missing or empty string', () => {
      const document = createBaseDocument({
        'simpl:edcRegistration': {
          'simpl:assetId': '', // empty string
          'simpl:contractDefinitionId': 'contract-123',
        },
        'simpl:edcConnector': {
          'simpl:providerEndpointURL': 'http://example.com',
        },
      });

      expect(isEligibleForContractNegotiation(document)).toBe(false);
    });

    it('returns false when contractDefinitionId is missing or empty string', () => {
      const document = createBaseDocument({
        'simpl:edcRegistration': {
          'simpl:assetId': 'asset-123',
          'simpl:contractDefinitionId': '', // empty string
        },
        'simpl:edcConnector': {
          'simpl:providerEndpointURL': 'http://example.com',
        },
      });

      expect(isEligibleForContractNegotiation(document)).toBe(false);
    });

    it('returns false when providerEndpointURL is missing or empty string', () => {
      const document = createBaseDocument({
        'simpl:edcRegistration': {
          'simpl:assetId': 'asset-123',
          'simpl:contractDefinitionId': 'contract-123',
        },
        'simpl:edcConnector': {
          'simpl:providerEndpointURL': '', // empty string
        },
      });

      expect(isEligibleForContractNegotiation(document)).toBe(false);
    });

    it('returns false when edcRegistration is missing', () => {
      const document = createBaseDocument({
        'simpl:edcConnector': {
          'simpl:providerEndpointURL': 'http://example.com',
        },
      });

      expect(isEligibleForContractNegotiation(document)).toBe(false);
    });

    it('returns false when edcConnector is missing', () => {
      const document = createBaseDocument({
        'simpl:edcRegistration': {
          'simpl:assetId': 'asset-123',
          'simpl:contractDefinitionId': 'contract-123',
        },
      });

      expect(isEligibleForContractNegotiation(document)).toBe(false);
    });

    it('returns true when all required fields are present and non-empty strings', () => {
      const document = createBaseDocument({
        'simpl:edcRegistration': {
          'simpl:assetId': 'asset-123',
          'simpl:contractDefinitionId': 'contract-123',
        },
        'simpl:edcConnector': {
          'simpl:providerEndpointURL': 'http://example.com',
        },
      });

      expect(isEligibleForContractNegotiation(document)).toBe(true);
    });

    it('returns true when all fields have multiple characters', () => {
      const document = createBaseDocument({
        'simpl:edcRegistration': {
          'simpl:assetId': 'asset-123-with-long-id',
          'simpl:contractDefinitionId': 'contract-123-with-long-id',
        },
        'simpl:edcConnector': {
          'simpl:providerEndpointURL': 'http://example.com/with/long/path',
        },
      });

      expect(isEligibleForContractNegotiation(document)).toBe(true);
    });
  });

  describe('getContractNegotiationData', () => {
    it('returns null when resourceDescriptionDocument is null', () => {
      expect(getContractNegotiationData(null)).toBe(null);
    });

    it('returns null when resource is not eligible for contract negotiation', () => {
      const document = createBaseDocument({
        'simpl:edcRegistration': {
          'simpl:assetId': '', // empty - not eligible
          'simpl:contractDefinitionId': 'contract-123',
        },
        'simpl:edcConnector': {
          'simpl:providerEndpointURL': 'http://example.com',
        },
      });

      expect(getContractNegotiationData(document)).toBe(null);
    });

    it('returns contract negotiation data when resource is eligible', () => {
      const document = createBaseDocument({
        'simpl:edcRegistration': {
          'simpl:assetId': 'asset-123',
          'simpl:contractDefinitionId': 'contract-123',
        },
        'simpl:edcConnector': {
          'simpl:providerEndpointURL': 'http://example.com',
        },
      });

      const result = getContractNegotiationData(document);

      expect(result).toEqual({
        providerEndpoint: 'http://example.com',
        assetId: 'asset-123',
        contractDefinitionId: 'contract-123',
      });
    });
  });

  describe('humanizeContractNegotiationStatus', () => {
    it('formats contract negotiation status correctly', () => {
      const status: ContractNegotiationStatusResponse = {
        '@id': 'negotiation-123',
        createdAt: 1634567890000,
        counterPartyAddress: 'http://counterparty.com',
        contractAgreementId: 'agreement-123',
        state: 'FINALIZED',
        counterPartyId: 'party-123',
        errorDetail: null,
        protocol: 'dataspace-protocol',
        type: 'CONTRACT_NEGOTIATION',
      };

      const result = humanizeContractNegotiationStatus(status);

      expect(result).toEqual({
        'Started at': 'formatted-1634567890000',
        'Contract negotiation ID': 'negotiation-123',
        'Counterparty Address': 'http://counterparty.com',
      });
    });

    it('handles status with error details', () => {
      const status: ContractNegotiationStatusResponse = {
        '@id': 'negotiation-456',
        createdAt: 1634567890000,
        counterPartyAddress: 'http://another-counterparty.com',
        contractAgreementId: null,
        state: 'TERMINATED',
        counterPartyId: 'party-456',
        errorDetail: 'Contract negotiation failed',
        protocol: 'dataspace-protocol',
        type: 'CONTRACT_NEGOTIATION',
      };

      const result = humanizeContractNegotiationStatus(status);

      expect(result).toEqual({
        'Started at': 'formatted-1634567890000',
        'Contract negotiation ID': 'negotiation-456',
        'Counterparty Address': 'http://another-counterparty.com',
      });
    });
  });
});
