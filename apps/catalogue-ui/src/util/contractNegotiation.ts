import { formatDateTime } from '@/util/dates';
import type {
  ContractNegotiationStatusResponse,
  SDWithContractNegotiationData,
} from 'types/contracts';
import type { SearchAPISelfDescriptionDocument } from 'types/searchApi';

export const isEligibleForContractNegotiation = (
  resourceDescriptionDocument: SearchAPISelfDescriptionDocument
) => {
  if (!resourceDescriptionDocument?.credentialSubject) {
    return false;
  }
  const sdDocument = resourceDescriptionDocument.credentialSubject as SDWithContractNegotiationData;
  return (
    sdDocument['simpl:edcRegistration']?.['simpl:assetId']?.length > 0 &&
    sdDocument['simpl:edcRegistration']?.['simpl:contractDefinitionId']?.length > 0 &&
    sdDocument['simpl:edcConnector']?.['simpl:providerEndpointURL']?.length > 0
  );
};

export const getContractNegotiationData = (
  resourceDescriptionDocument: SearchAPISelfDescriptionDocument | null
) => {
  if (
    !resourceDescriptionDocument ||
    !isEligibleForContractNegotiation(resourceDescriptionDocument)
  ) {
    return null;
  }
  const sdDocument = resourceDescriptionDocument.credentialSubject as SDWithContractNegotiationData;

  return {
    providerEndpoint: sdDocument['simpl:edcConnector']!['simpl:providerEndpointURL']!,
    assetId: sdDocument['simpl:edcRegistration']!['simpl:assetId']!,
    contractDefinitionId: sdDocument['simpl:edcRegistration']!['simpl:contractDefinitionId']!,
  };
};

export const humanizeContractNegotiationStatus = (status: ContractNegotiationStatusResponse) => {
  const humanizedStatus = {
    'Started at': formatDateTime(status.createdAt),
    'Contract negotiation ID': status['@id'],
    'Counterparty Address': status.counterPartyAddress,
  };

  return humanizedStatus;
};
