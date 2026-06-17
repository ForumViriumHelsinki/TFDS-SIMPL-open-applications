import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  initiateContractNegotiation,
  getCatalogueOffers,
  getContractNegotiationStatus,
} from '@/services/mock/mockContractConsumption';
import type {
  ContractNegotiationRequestData,
  ContractNegotiationInitiateResponse,
  ContractOffersResponse,
  ContractNegotiationStatusResponse,
} from 'types/contracts';

describe('mockContractConsumption', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock setTimeout to avoid actual delays in tests
    vi.stubGlobal(
      'setTimeout',
      vi.fn((callback) => {
        callback();
        return 1;
      })
    );
  });

  describe('initiateContractNegotiation', () => {
    it('should return contract negotiation ID with 200 status', async () => {
      const mockRequestData: ContractNegotiationRequestData = {
        providerEndpoint: 'https://test-provider.com',
        contractDefinitionId: 'test-definition-id',
        assetId: 'test-asset-id',
      };

      const response = await initiateContractNegotiation(mockRequestData);

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);

      const data: ContractNegotiationInitiateResponse = await response.json();
      expect(data).toEqual({
        contractNegotiationId: 'negotiation-id',
      });
    });

    it('should accept optional keycloak token', async () => {
      const mockRequestData: ContractNegotiationRequestData = {
        providerEndpoint: 'https://test-provider.com',
        contractDefinitionId: 'test-definition-id',
        assetId: 'test-asset-id',
      };

      const response = await initiateContractNegotiation(mockRequestData, 'test-token');

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
    });
  });

  describe('getCatalogueOffers', () => {
    it('should return catalogue offers with 200 status', async () => {
      const mockRequestData: ContractNegotiationRequestData = {
        providerEndpoint: 'https://test-provider.com',
        contractDefinitionId: 'test-definition-id',
        assetId: 'test-asset-id',
      };

      const response = await getCatalogueOffers(mockRequestData);

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);

      const data: ContractOffersResponse = await response.json();
      expect(data.offers).toHaveLength(1);
      expect(data.offers[0]).toEqual({
        providerParticipantId: 'provider-participant-id',
        providerEndpointUrl: 'https://provider-endpoint.com',
        assetId: mockRequestData.assetId,
        offerId: 'offer-id',
        policy: {
          policyConstraints: [
            {
              condition: 'deletion',
              conditionOperator: 'equals',
              conditionValue: 'true',
            },
          ],
        },
      });
    });

    it('should include the provided asset ID in the response', async () => {
      const mockRequestData: ContractNegotiationRequestData = {
        providerEndpoint: 'https://test-provider.com',
        contractDefinitionId: 'test-definition-id',
        assetId: 'custom-asset-id',
      };

      const response = await getCatalogueOffers(mockRequestData);
      const data: ContractOffersResponse = await response.json();

      expect(data.offers[0].assetId).toBe('custom-asset-id');
    });

    it('should accept optional keycloak token', async () => {
      const mockRequestData: ContractNegotiationRequestData = {
        providerEndpoint: 'https://test-provider.com',
        contractDefinitionId: 'test-definition-id',
        assetId: 'test-asset-id',
      };

      const response = await getCatalogueOffers(mockRequestData, 'test-token');

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
    });
  });

  describe('getContractNegotiationStatus', () => {
    it('should return contract negotiation status with 200 status', async () => {
      const negotiationId = 'test-negotiation-id';

      const response = await getContractNegotiationStatus(negotiationId);

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);

      const data: ContractNegotiationStatusResponse = await response.json();
      expect(data).toEqual({
        contractAgreementId: 'agreement-id',
        state: 'FINALIZED',
        counterPartyAddress: 'https://counterparty-endpoint.com',
        counterPartyId: 'counter-party-id',
        errorDetail: null,
        protocol: 'some-protocol',
        type: 'some-type',
        createdAt: expect.any(Number),
        '@id': 'negotiation-id',
      });
    });

    it('should accept optional keycloak token', async () => {
      const negotiationId = 'test-negotiation-id';

      const response = await getContractNegotiationStatus(negotiationId, 'test-token');

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
    });

    it('should return finalized state', async () => {
      const negotiationId = 'test-negotiation-id';

      const response = await getContractNegotiationStatus(negotiationId);
      const data: ContractNegotiationStatusResponse = await response.json();

      expect(data.state).toBe('FINALIZED');
      expect(data.errorDetail).toBeNull();
    });

    it('should include correct timestamp format', async () => {
      const negotiationId = 'test-negotiation-id';

      const response = await getContractNegotiationStatus(negotiationId);
      const data: ContractNegotiationStatusResponse = await response.json();

      expect(typeof data.createdAt).toBe('number');
      expect(data.createdAt).toBeGreaterThan(0);
    });
  });
});
