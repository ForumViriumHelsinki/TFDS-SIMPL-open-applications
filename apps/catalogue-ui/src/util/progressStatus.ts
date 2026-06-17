export type DisplayedStatusLabel = 'In Progress' | 'Successful' | 'Failed';

export const mapContractStatusToProgress = (status?: string): DisplayedStatusLabel | undefined => {
  if (!status) {
    return undefined;
  }
  switch (status.toUpperCase()) {
    case 'INITIAL':
    case 'REQUESTED':
    case 'PROVISIONING':
    case 'DEPROVISIONING':
      return 'In Progress';
    case 'FINALIZED':
    case 'DEPROVISIONED':
    case 'COMPLETED':
      return 'Successful';
    case 'TERMINATED':
      return 'Failed';
    default:
      return 'In Progress';
  }
};

export const getProgressChipConfig = (mappedStatus: DisplayedStatusLabel) => {
  switch (mappedStatus) {
    case 'In Progress':
      return {
        label: 'In Progress',
        chipClasses: '!bg-warning-lightest !border-warning-base !text-warning-base',
        iconName: 'sync',
      };
    case 'Successful':
      return {
        label: 'Successful',
        chipClasses: '!bg-success-light !border-success-base !text-success-base',
        iconName: 'checkmark-circle',
      };
    case 'Failed':
      return {
        label: 'Failed',
        chipClasses: '!bg-danger-lightest !border-danger-base !text-danger-base',
        iconName: 'alert-circle',
      };
    default:
      return {
        label: mappedStatus,
        chipClasses: '!bg-neutral-light !border-neutral-base !text-neutral-base',
        iconName: '',
      };
  }
};

export const isProgressEnded = (status?: DisplayedStatusLabel) => {
  if (status === 'Failed' || status === 'Successful') {
    return true;
  }
  return false;
};
