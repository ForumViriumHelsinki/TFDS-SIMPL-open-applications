import type {
  ContractNegotiationInitiateResponse,
  ContractNegotiationRequestData,
  ContractNegotiationStatusResponse,
  ContractNegotiationStatusState,
  ContractOffersResponse,
} from 'types/contracts';
import type { ProblemDetailsResponse } from '@simpl/vue-components';

export const initiateContractNegotiation = async (
  contractNegotiationRequestData: ContractNegotiationRequestData,
  keycloakToken?: string
) => {
  await new Promise((resolve) => setTimeout(resolve, 5000));
  return new Response(
    JSON.stringify({
      contractNegotiationId: 'negotiation-id',
    } as ContractNegotiationInitiateResponse),
    { status: 200 }
  );
};

export const getCatalogueOffers = async (
  contractNegotiationRequestData: ContractNegotiationRequestData,
  keycloakToken?: string
) => {
  return new Response(
    JSON.stringify({
      offers: [
        {
          providerParticipantId: 'provider-participant-id',
          providerEndpointUrl: 'https://provider-endpoint.com',
          assetId: contractNegotiationRequestData.assetId,
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
        },
      ],
    } as ContractOffersResponse),
    { status: 200 }
  );
};

const getMockStatus = (
  status: ContractNegotiationStatusState
): ContractNegotiationStatusResponse => {
  return {
    contractAgreementId: 'agreement-id',
    state: status,
    counterPartyAddress: 'https://counterparty-endpoint.com',
    counterPartyId: 'counter-party-id',
    errorDetail: status === 'TERMINATED' ? 'An error occurred' : null,
    protocol: 'some-protocol',
    type: 'some-type',
    createdAt: Date.now(),
    '@id': 'negotiation-id',
  };
};

const getMockError = (): ProblemDetailsResponse => {
  return {
    type: 'https://example.com/error',
    title: 'An error occurred',
    status: 500,
    detail: 'Detailed error message',
    instance: 'https://example.com/instance',
  };
};

export const getContractNegotiationStatus = async (
  negotiationId: string,
  keycloakToken?: string
) => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return new Response(JSON.stringify(getMockStatus('FINALIZED')), {
    status: 200,
  });
};
