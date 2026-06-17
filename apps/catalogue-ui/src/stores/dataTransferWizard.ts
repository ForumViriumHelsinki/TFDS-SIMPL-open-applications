import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { useContractNegotiationStore } from './contractNegotiation';
import { useTransferProcessStore } from './transferProcess';
import { useResourceSharingMethodStore } from './resourceSharingMethod';

type DataTransferWizardStepName = 'contractNegotiation' | 'transferDetails' | 'transferProcess';
type DataTransferWizardStepDetails = {
  title: string;
  startCallback?: () => void;
  isNextStepAvailable: boolean;
  nextStepLabel?: string;
  nextStepIcon?: string;
};

type DataTransferWizardSteps = Record<DataTransferWizardStepName, DataTransferWizardStepDetails>;

export const useDataTransferWizardStore = defineStore('dataTransferWizard', () => {
  const initiateDataTransferOverlay = () => {
    const contractNegotiationStore = useContractNegotiationStore();
    contractNegotiationStore.initiateNegotiation();
  };

  const isOverlayVisible = ref(false);

  const openOverlay = () => {
    isOverlayVisible.value = true;
    initiateDataTransferOverlay();
  };

  const closeOverlay = () => {
    isOverlayVisible.value = false;
    resetTransferState();
  };

  const step = ref<DataTransferWizardStepName>('contractNegotiation');

  const steps = computed<DataTransferWizardSteps>(() => {
    const contractNegotiationStore = useContractNegotiationStore();
    const transferProcessStore = useTransferProcessStore();
    const resourceSharingMethodStore = useResourceSharingMethodStore();

    return {
      contractNegotiation: {
        title: 'Contract Negotiation',
        startCallback: contractNegotiationStore.initiateNegotiation,
        isNextStepAvailable: contractNegotiationStore.isNegotiationFinalized,
      },
      transferDetails: {
        title: 'Transfer Details',
        startCallback: resourceSharingMethodStore.initializeResourceSharingMethods,
        isNextStepAvailable: resourceSharingMethodStore.isResourceAddressReady,
      },
      transferProcess: {
        title: 'Transfer Process',
        startCallback: transferProcessStore.initiateTransferProcess,
        isNextStepAvailable: transferProcessStore.isTransferProcessFinalized,
        nextStepLabel: 'Complete',
        nextStepIcon: '',
      },
    };
  });

  const goNextStep = (nextStepName?: DataTransferWizardStepName) => {
    if (!nextStepName) {
      const currentStepIndex = Object.keys(steps.value).indexOf(step.value);
      nextStepName = Object.keys(steps.value)[currentStepIndex + 1] as DataTransferWizardStepName;
    }
    if (steps.value[nextStepName]) {
      step.value = nextStepName!;
    } else {
      closeOverlay();
    }
    steps.value[nextStepName]?.startCallback?.();
  };

  const resetTransferState = () => {
    const contractNegotiationStore = useContractNegotiationStore();
    const transferProcessStore = useTransferProcessStore();
    const resourceSharingMethodStore = useResourceSharingMethodStore();

    step.value = 'contractNegotiation';
    contractNegotiationStore.resetNegotiationState();
    transferProcessStore.resetTransferState();
    resourceSharingMethodStore.resetResourceSharingMethods();
  };

  return {
    isOverlayVisible,
    openOverlay,
    closeOverlay,
    initiateDataTransferOverlay,
    step,
    steps,
    goNextStep,
    resetTransferState,
  };
});
