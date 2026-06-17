import { fetchLocalEndpoint } from '@/util/services';
import type { EdcTransferProcessResponse, EdcTransferProcessStatusResponse, EdcTransferRequestData } from 'types/contracts';

export function useTransferProcess() {
  const startTransferProcess = async (transferRequestData: EdcTransferRequestData) =>
    fetchLocalEndpoint<EdcTransferProcessResponse>('/api/transfers', {
      method: 'POST',
      body: transferRequestData,
      errorIdentifier: 'TRANSFER_PROCESS_ERROR',
      apiName: 'transfer process',
    });

  const fetchTransferProcessStatus = async (transferProcessId: string) =>
    fetchLocalEndpoint<EdcTransferProcessStatusResponse>(
      `/api/transfers/${transferProcessId}`,
      {
        method: 'GET',
        errorIdentifier: 'TRANSFER_STATUS_ERROR',
        apiName: 'transfer',
      }
    );

  return {
    startTransferProcess,
    fetchTransferProcessStatus,
  };
}
