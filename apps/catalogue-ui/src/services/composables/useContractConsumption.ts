import type {
  ContractNegotiationInitiateResponse,
  ContractNegotiationRequestData,
  ContractNegotiationStatusResponse,
  ContractOffersResponse,
} from 'types/contracts';
import { fetchLocalEndpoint } from '@/util/services';

export function useContractConsumption() {
  const getCatalogOffers = (negotiationData: ContractNegotiationRequestData) =>
    fetchLocalEndpoint<
      ContractOffersResponse,
      ContractOffersResponse,
      null,
      ContractNegotiationRequestData
    >('/api/connectorCatalog/assets', {
      method: 'POST',
      errorIdentifier: 'CONTRACT_OFFERS_ERROR',
      apiName: 'contract negotiation',
      body: negotiationData,
    });

  const startContractNegotiation = (negotiationData: ContractNegotiationRequestData) =>
    fetchLocalEndpoint<
      ContractNegotiationInitiateResponse,
      ContractNegotiationInitiateResponse,
      null,
      ContractNegotiationRequestData
    >('/api/contracts', {
      method: 'POST',
      errorIdentifier: 'NEGOTIATION_STATUS_ERROR',
      apiName: 'contract negotiation',
      body: negotiationData,
    });

  const fetchContractNegotiationStatus = (negotiationId: string) =>
    fetchLocalEndpoint<ContractNegotiationStatusResponse>(
      `/api/contracts/${negotiationId}`,
      {
        method: 'GET',
        errorIdentifier: 'NEGOTIATION_STATUS_ERROR',
        apiName: 'contract negotiation',
      }
    );

  return {
    getCatalogOffers,
    startContractNegotiation,
    fetchContractNegotiationStatus,
  };
}
