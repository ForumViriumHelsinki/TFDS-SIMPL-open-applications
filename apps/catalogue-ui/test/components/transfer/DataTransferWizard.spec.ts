import { describe, it, expect, vi } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';

// Create actual refs for the mock
const mockStep = ref('contractNegotiation');
const mockSteps = ref({
  contractNegotiation: { title: 'Contract Negotiation' },
  transferDetails: { title: 'Transfer Details' },
  transferProcess: { title: 'Transfer Process' },
});

// Mock all dependencies to avoid complex store interactions
vi.mock('@/stores', () => ({
  useDataTransferWizardStore: vi.fn(() => ({
    step: mockStep,
    steps: mockSteps,
  })),
}));

vi.mock('pinia', () => ({
  storeToRefs: vi.fn((store: any) => store),
}));

vi.mock('@simpl/vue-components', () => ({
  SStepper: { 
    name: 'SStepper', 
    template: '<div class="mocked-stepper" :id="id"><slot /></div>', 
    props: ['id', 'value', 'orientation', 'linear'] 
  },
  SStepList: { name: 'SStepList', template: '<div><slot /></div>' },
  SStep: { 
    name: 'SStep', 
    template: '<div class="mocked-step" :id="id"><slot /></div>', 
    props: ['id', 'value', 'label'] 
  },
}));

vi.mock('primevue', () => ({
  StepPanels: { name: 'StepPanels', template: '<div><slot /></div>' },
  StepPanel: { name: 'StepPanel', template: '<div class="mocked-panel"><slot /></div>', props: ['value'] },
}));

vi.mock('@/components/transfer/ContractNegotiationStep.vue', () => ({
  default: {
    name: 'ContractNegotiationStep',
    template: '<div class="contract-step">Contract</div>',
  },
}));

vi.mock('@/components/transfer/TransferDetailsStep.vue', () => ({
  default: { name: 'TransferDetailsStep', template: '<div class="details-step">Details</div>' },
}));

vi.mock('@/components/transfer/TransferProcessStep.vue', () => ({
  default: { name: 'TransferProcessStep', template: '<div class="process-step">Process</div>' },
}));

describe('DataTransferWizard.vue', () => {
  it('can be imported without errors', async () => {
    const { default: DataTransferWizard } =
      await import('@/components/transfer/DataTransferWizard.vue');
    expect(DataTransferWizard).toBeDefined();
  });

  it('renders with all ID attributes on stepper and steps', async () => {
    const { default: DataTransferWizard } =
      await import('@/components/transfer/DataTransferWizard.vue');
    
    const wrapper = mount(DataTransferWizard);
    
    // Verify the IDs are rendered
    const html = wrapper.html();
    expect(html).toContain('data-transfer-stepper');
    expect(html).toContain('step-contract-negotiation');
    expect(html).toContain('step-transfer-details');
    expect(html).toContain('step-transfer-process');
  });
});
