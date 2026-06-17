import type {
  EdcTransferProcessResponse,
  EdcTransferProcessStatusResponse,
  EdcTransferProcessStatusState,
  EdcTransferRequestData,
} from 'types/contracts';

export const startTransferProcess = async (
  transferRequest: EdcTransferRequestData,
  keycloakToken?: string
): Promise<Response> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const mockTransferResponse: EdcTransferProcessResponse = {
    transferProcessId: 'transfer-process-id',
  };

  return new Response(JSON.stringify(mockTransferResponse), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const getTransferProcessStatus = async (
  transferProcessId: string,
  keycloakToken?: string
): Promise<Response> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Simulate different states based on the ID
  const states: EdcTransferProcessStatusState[] = [
    'INITIAL',
    'PROVISIONING',
    'DEPROVISIONING',
    'DEPROVISIONED',
    'COMPLETED',
    'TERMINATED',
  ];

  const randomStatusIndex = Math.floor(Math.random() * states.length);
  const randomStatus = states[randomStatusIndex];

  const mockStatusResponse: EdcTransferProcessStatusResponse = {
    '@id': transferProcessId,
    state: randomStatus,
    stateTimestamp: Date.now(),
    type: 'CONSUMER',
    finalState: randomStatus,
    assetId: 'asset-id',
    contractId: 'contract-id',
    transferType: 'DATA',
  };

  return new Response(JSON.stringify(mockStatusResponse), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
