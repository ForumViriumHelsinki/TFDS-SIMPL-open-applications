export interface ContractNegotiationRequestData {
  providerEndpoint: string;
  contractDefinitionId: string;
  assetId: string;
}

export interface SDWithContractNegotiationData {
  'simpl:edcConnector': {
    'simpl:providerEndpointURL': string;
  };
  'simpl:edcRegistration': {
    'simpl:accessPolicyId': string;
    'simpl:assetId': string;
    'simpl:contractDefinitionId': string;
    'simpl:servicePolicyId': string;
  };
  [key: string]: unknown;
}

export interface ContractAccessPolicyConstraint {
  condition: 'deletion' | 'count' | 'dateTime';
  conditionOperator: string;
  conditionValue: string;
}

export interface ContractAccessPolicy {
  policyConstraints: ContractAccessPolicyConstraint[];
}

export interface ContractOffer {
  providerParticipantId: string;
  providerEndpointUrl: string;
  assetId: string;
  offerId: string;
  policy: ContractAccessPolicy;
}

export interface ContractOffersResponse {
  offers: ContractOffer[];
}

export interface ContractNegotiationInitiateResponse {
  contractNegotiationId: string;
}

export type ContractNegotiationStatusState = 'INITIAL' | 'REQUESTED' | 'FINALIZED' | 'TERMINATED';

export interface ContractNegotiationStatusResponse {
  '@id': string;
  contractAgreementId: string | null;
  state: ContractNegotiationStatusState;
  counterPartyAddress: string;
  counterPartyId: string;
  errorDetail: string | null;
  protocol: string;
  type: string;
  createdAt: number;
}

export interface EdcS3DataDestination {
  type: string;
  region: string;
  consumerEmail?: string;
  storage: string;
  bucketName: string;
  blobName: string;
  path: string;
  accessKey: string;
  secretKey: string;
  keyName: string;
}

export interface EdcInfraDataDestination {
  type: 'infrastructure';
  consumerEmail: string;
}

export interface EdcTransferRequestData {
  providerEndpoint: string;
  contractId: string;
  templateId: string;
  dataDestination: object;
}

export interface EdcTransferProcessResponse {
  transferProcessId: string;
}

export type EdcTransferProcessStatusState =
  | 'INITIAL'
  | 'PROVISIONING'
  | 'DEPROVISIONED'
  | 'DEPROVISIONING'
  | 'COMPLETED'
  | 'TERMINATED';

export interface EdcTransferProcessStatusResponse {
  finalState: EdcTransferProcessStatusState;
  assetId: string;
  contractId: string;
  transferType: string;
  type: string;
  stateTimestamp: number;
  errorDetail?: string;
  '@id': string;
  state: EdcTransferProcessStatusState;
}

export type ContractResourceType = 'data' | 'infrastructure' | 'application';
