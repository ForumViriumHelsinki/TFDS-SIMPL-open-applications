import { formatDateTime } from '@/util/dates';
import type { EdcTransferProcessStatusResponse } from 'types/contracts';

export const humanizeTransferProcessStatus = (
  status: EdcTransferProcessStatusResponse,
  startedAt: Date | null
) => {
  const humanizedStatus = {
    'Started at': startedAt ? formatDateTime(startedAt) : 'N/A',
    'Transfer Process ID': status['@id'],
    'Transfer Type': status.transferType,
    'Transfer State': status.state,
    'Last state update': status.stateTimestamp
      ? formatDateTime(new Date(status.stateTimestamp))
      : 'N/A',
  };

  return humanizedStatus;
};
