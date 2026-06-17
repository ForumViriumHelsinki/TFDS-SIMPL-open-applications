import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ContractNegotiationStep from '@/components/transfer/ContractNegotiationStep.vue';

// Mock Pinia stores
vi.mock('@/stores', () => ({
  useContractNegotiationStore: vi.fn(() => ({})),
  useResourceDescriptionStore: vi.fn(() => ({})),
}));

vi.mock('pinia', () => ({
  storeToRefs: vi.fn(() => ({
    negotiationStatus: { value: null },
    negotiationStatusError: { value: null },
    resourceDescriptionSummary: { value: { title: 'Test Resource' } },
  })),
}));

// Mock utility functions
vi.mock('@/util/contractNegotiation', () => ({
  humanizeContractNegotiationStatus: vi.fn(() => 'Mocked negotiation status'),
}));

vi.mock('@/util/progressStatus', () => ({
  mapContractStatusToProgress: vi.fn(() => 'In Progress'),
}));

// Mock ProgressScreen component
vi.mock('@/components/transfer/ProgressScreen.vue', () => ({
  default: {
    name: 'ProgressScreen',
    template: `
      <div class="mocked-progress-screen" 
           :data-title="title" 
           :data-process-name="processName"
           :data-status="status">
        <slot name="inProgressDescription" />
        <slot name="successDescription" />
        <slot name="failedDescription" />
      </div>
    `,
    props: ['title', 'processName', 'status', 'processError', 'startedAt', 'processDetails'],
  },
}));

describe('ContractNegotiationStep.vue', () => {
  it('renders the component', () => {
    const wrapper = mount(ContractNegotiationStep);

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('.mocked-progress-screen').exists()).toBe(true);
  });

  it('passes correct title to ProgressScreen', () => {
    const wrapper = mount(ContractNegotiationStep);

    const progressScreen = wrapper.find('.mocked-progress-screen');
    expect(progressScreen.attributes('data-title')).toBe('Contract Negotiation');
  });

  it('passes correct process name to ProgressScreen', () => {
    const wrapper = mount(ContractNegotiationStep);

    const progressScreen = wrapper.find('.mocked-progress-screen');
    expect(progressScreen.attributes('data-process-name')).toBe('contract-negotiation');
  });

  it('displays in-progress description', () => {
    const wrapper = mount(ContractNegotiationStep);

    expect(wrapper.text()).toContain('is being negotiated');
  });

  it('displays success description', () => {
    const wrapper = mount(ContractNegotiationStep);

    expect(wrapper.text()).toContain('The contract negotiation has been completed');
  });

  it('displays failed description', () => {
    const wrapper = mount(ContractNegotiationStep);

    expect(wrapper.text()).toContain('The negotiation has failed');
  });
});
