import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useDataTransferWizardStore } from '@/stores/dataTransferWizard';
import { useContractNegotiationStore } from '@/stores/contractNegotiation';
import { useTransferProcessStore } from '@/stores/transferProcess';
import { useResourceSharingMethodStore } from '@/stores/resourceSharingMethod';

// Mock dependencies
vi.mock('@/stores/contractNegotiation', () => ({
  useContractNegotiationStore: vi.fn(),
}));

vi.mock('@/stores/transferProcess', () => ({
  useTransferProcessStore: vi.fn(),
}));

vi.mock('@/stores/resourceSharingMethod', () => ({
  useResourceSharingMethodStore: vi.fn(),
}));

describe('dataTransferWizard store', () => {
  let store: ReturnType<typeof useDataTransferWizardStore>;
  let mockContractNegotiationStore: any;
  let mockTransferProcessStore: any;
  let mockResourceSharingMethodStore: any;

  beforeEach(() => {
    setActivePinia(createPinia());

    // Setup mock stores with all necessary methods and properties
    mockContractNegotiationStore = {
      initiateNegotiation: vi.fn(),
      resetNegotiationState: vi.fn(),
      isNegotiationFinalized: false,
    };

    mockTransferProcessStore = {
      initiateTransferProcess: vi.fn(),
      resetTransferState: vi.fn(),
      isTransferProcessFinalized: false,
    };

    mockResourceSharingMethodStore = {
      resetResourceSharingMethods: vi.fn(),
      isResourceAddressReady: false,
    };

    vi.mocked(useContractNegotiationStore).mockReturnValue(mockContractNegotiationStore);
    vi.mocked(useTransferProcessStore).mockReturnValue(mockTransferProcessStore);
    vi.mocked(useResourceSharingMethodStore).mockReturnValue(mockResourceSharingMethodStore);

    store = useDataTransferWizardStore();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('overlay management', () => {
    it('should initialize with overlay closed', () => {
      expect(store.isOverlayVisible).toBe(false);
    });

    it('should open overlay and initiate data transfer', () => {
      store.openOverlay();

      expect(store.isOverlayVisible).toBe(true);
      expect(mockContractNegotiationStore.initiateNegotiation).toHaveBeenCalled();
    });

    it('should close overlay and reset transfer state', () => {
      // First open the overlay
      store.openOverlay();
      expect(store.isOverlayVisible).toBe(true);

      // Then close it
      store.closeOverlay();

      expect(store.isOverlayVisible).toBe(false);
      expect(mockContractNegotiationStore.resetNegotiationState).toHaveBeenCalled();
      expect(mockTransferProcessStore.resetTransferState).toHaveBeenCalled();
      expect(mockResourceSharingMethodStore.resetResourceSharingMethods).toHaveBeenCalled();
    });

    it('should call initiateDataTransferOverlay directly', () => {
      store.initiateDataTransferOverlay();
      expect(mockContractNegotiationStore.initiateNegotiation).toHaveBeenCalled();
    });
  });

  describe('step management', () => {
    it('should initialize with contractNegotiation step', () => {
      expect(store.step).toBe('contractNegotiation');
    });

    it('should reset step to contractNegotiation when resetting state', () => {
      store.step = 'transferProcess';
      store.resetTransferState();
      expect(store.step).toBe('contractNegotiation');
    });
  });

  describe('steps computed property', () => {
    it('should return correct step configuration with default availability', () => {
      const steps = store.steps;

      expect(steps.contractNegotiation).toEqual({
        title: 'Contract Negotiation',
        startCallback: mockContractNegotiationStore.initiateNegotiation,
        isNextStepAvailable: false, // mockContractNegotiationStore.isNegotiationFinalized
      });

      expect(steps.transferDetails).toEqual({
        title: 'Transfer Details',
        isNextStepAvailable: false, // mockResourceSharingMethodStore.isResourceAddressReady
      });

      expect(steps.transferProcess).toEqual({
        title: 'Transfer Process',
        startCallback: mockTransferProcessStore.initiateTransferProcess,
        isNextStepAvailable: false, // mockTransferProcessStore.isTransferProcessFinalized
        nextStepLabel: 'Complete',
        nextStepIcon: '',
      });
    });

    it('should reflect contract negotiation availability', () => {
      mockContractNegotiationStore.isNegotiationFinalized = true;

      const steps = store.steps;
      expect(steps.contractNegotiation.isNextStepAvailable).toBe(true);
    });

    it('should reflect resource address readiness', () => {
      mockResourceSharingMethodStore.isResourceAddressReady = true;

      const steps = store.steps;
      expect(steps.transferDetails.isNextStepAvailable).toBe(true);
    });

    it('should reflect transfer process finalization', () => {
      mockTransferProcessStore.isTransferProcessFinalized = true;

      const steps = store.steps;
      expect(steps.transferProcess.isNextStepAvailable).toBe(true);
    });
  });

  describe('goNextStep function', () => {
    it('should advance to next step automatically when no step name provided', () => {
      store.step = 'contractNegotiation';
      store.goNextStep();

      expect(store.step).toBe('transferDetails');
    });

    it('should advance from transferDetails to transferProcess', () => {
      store.step = 'transferDetails';
      store.goNextStep();

      expect(store.step).toBe('transferProcess');
      expect(mockTransferProcessStore.initiateTransferProcess).toHaveBeenCalled();
    });

    it('should close overlay when advancing beyond last step', () => {
      store.openOverlay(); // Make sure overlay is open first
      store.step = 'transferProcess';
      
      // Mock that the transfer process is finalized to allow advancing
      mockTransferProcessStore.isTransferProcessFinalized = true;
      
      store.goNextStep();

      expect(store.isOverlayVisible).toBe(false);
    });

    it('should advance to specific step when provided', () => {
      store.step = 'contractNegotiation';
      store.goNextStep('transferProcess');

      expect(store.step).toBe('transferProcess');
      expect(mockTransferProcessStore.initiateTransferProcess).toHaveBeenCalled();
    });

    it('should call startCallback for target step when it exists', () => {
      store.step = 'transferDetails';
      store.goNextStep('contractNegotiation');

      expect(store.step).toBe('contractNegotiation');
      expect(mockContractNegotiationStore.initiateNegotiation).toHaveBeenCalled();
    });

    it('should handle steps without startCallback gracefully', () => {
      store.step = 'contractNegotiation';
      store.goNextStep('transferDetails');

      expect(store.step).toBe('transferDetails');
      // No startCallback for transferDetails, so no function should be called
    });

    it('should close overlay when trying to go to invalid step', () => {
      store.openOverlay(); // Make sure overlay is open first
      store.goNextStep('invalidStep' as any);

      expect(store.isOverlayVisible).toBe(false);
    });
  });

  describe('resetTransferState function', () => {
    it('should reset all stores and step', () => {
      store.step = 'transferProcess';
      store.resetTransferState();

      expect(store.step).toBe('contractNegotiation');
      expect(mockContractNegotiationStore.resetNegotiationState).toHaveBeenCalled();
      expect(mockTransferProcessStore.resetTransferState).toHaveBeenCalled();
      expect(mockResourceSharingMethodStore.resetResourceSharingMethods).toHaveBeenCalled();
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete workflow: open -> negotiate -> transfer details -> transfer process -> close', () => {
      // Start workflow
      store.openOverlay();
      expect(store.isOverlayVisible).toBe(true);
      expect(store.step).toBe('contractNegotiation');
      expect(mockContractNegotiationStore.initiateNegotiation).toHaveBeenCalledTimes(1);

      // Simulate contract negotiation completion
      mockContractNegotiationStore.isNegotiationFinalized = true;
      store.goNextStep();
      expect(store.step).toBe('transferDetails');

      // Simulate resource address readiness
      mockResourceSharingMethodStore.isResourceAddressReady = true;
      store.goNextStep();
      expect(store.step).toBe('transferProcess');
      expect(mockTransferProcessStore.initiateTransferProcess).toHaveBeenCalled();

      // Simulate transfer process completion and close
      mockTransferProcessStore.isTransferProcessFinalized = true;
      store.goNextStep();
      expect(store.isOverlayVisible).toBe(false);
    });

    it('should handle overlay close at any step', () => {
      store.openOverlay();
      store.step = 'transferDetails';

      store.closeOverlay();

      expect(store.isOverlayVisible).toBe(false);
      expect(store.step).toBe('contractNegotiation'); // Reset by resetTransferState
    });

    it('should handle multiple overlay open/close cycles', () => {
      // First cycle
      store.openOverlay();
      expect(mockContractNegotiationStore.initiateNegotiation).toHaveBeenCalledTimes(1);
      store.closeOverlay();
      expect(mockContractNegotiationStore.resetNegotiationState).toHaveBeenCalledTimes(1);

      // Second cycle
      store.openOverlay();
      expect(mockContractNegotiationStore.initiateNegotiation).toHaveBeenCalledTimes(2);
      store.closeOverlay();
      expect(mockContractNegotiationStore.resetNegotiationState).toHaveBeenCalledTimes(2);
    });
  });

  describe('step configuration edge cases', () => {
    it('should handle step callbacks being undefined', () => {
      // transferDetails has no startCallback
      store.step = 'contractNegotiation';
      
      expect(() => store.goNextStep('transferDetails')).not.toThrow();
      expect(store.step).toBe('transferDetails');
    });

    it('should maintain step order consistency', () => {
      const stepNames = Object.keys(store.steps);
      expect(stepNames).toEqual(['contractNegotiation', 'transferDetails', 'transferProcess']);
    });
  });
});
