import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import TransferProcessStep from '@/components/transfer/TransferProcessStep.vue';

// Mock Pinia stores
vi.mock('@/stores', () => ({
  useTransferProcessStore: vi.fn(() => ({})),
}));

vi.mock('pinia', () => ({
  storeToRefs: vi.fn(() => ({
    transferProcessStatus: { value: { state: 'RUNNING' } },
    transferProcessError: { value: null },
    transferProcessStartedAt: { value: new Date().getTime() },
  })),
}));

// Mock utility functions
vi.mock('@/util/transferProcess', () => ({
  humanizeTransferProcessStatus: vi.fn(() => 'Mocked transfer process status'),
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

describe('TransferProcessStep.vue', () => {
  it('renders the component', () => {
    const wrapper = mount(TransferProcessStep);

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('.mocked-progress-screen').exists()).toBe(true);
  });

  it('passes correct title to ProgressScreen', () => {
    const wrapper = mount(TransferProcessStep);

    const progressScreen = wrapper.find('.mocked-progress-screen');
    expect(progressScreen.attributes('data-title')).toBe('Transfer process');
  });

  it('passes correct process name to ProgressScreen', () => {
    const wrapper = mount(TransferProcessStep);

    const progressScreen = wrapper.find('.mocked-progress-screen');
    expect(progressScreen.attributes('data-process-name')).toBe('transfer-process');
  });

  it('displays in-progress description', () => {
    const wrapper = mount(TransferProcessStep);

    expect(wrapper.text()).toContain(
      'The selected element is being transfered to the provided address'
    );
    expect(wrapper.text()).toContain('The process might take a few minutes');
  });

  it('displays success description', () => {
    const wrapper = mount(TransferProcessStep);

    expect(wrapper.text()).toContain('The transfer has been completed');
  });

  it('displays failed description', () => {
    const wrapper = mount(TransferProcessStep);

    expect(wrapper.text()).toContain('The transfer process has failed');
    expect(wrapper.text()).toContain('Please retry or exit the process');
  });

  it('uses mapped status from utility function', () => {
    const wrapper = mount(TransferProcessStep);

    const progressScreen = wrapper.find('.mocked-progress-screen');
    expect(progressScreen.attributes('data-status')).toBe('In Progress');
  });
});
