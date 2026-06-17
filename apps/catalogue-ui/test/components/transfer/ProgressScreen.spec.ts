import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ProgressScreen from '@/components/transfer/ProgressScreen.vue';

// Mock timers to prevent real intervals from running

// Mock date utilities
vi.mock('@/util/dates', () => ({
  formatElapsedTime: vi.fn(() => '5s'),
  formatTimeConditional: vi.fn(() => '10:00:00'),
}));

// Mock VueUse interval function
vi.mock('@vueuse/core', () => ({
  useIntervalFn: vi.fn(() => ({
    pause: vi.fn(),
    resume: vi.fn(),
  })),
}));

// Mock progress status utility
vi.mock('@/util/progressStatus', () => ({
  isProgressEnded: vi.fn((status) => status === 'Successful' || status === 'Failed'),
}));

// Mock child components
vi.mock('@/components/transfer/ProgressChip.vue', () => ({
  default: {
    name: 'ProgressChip',
    template: '<div class="mocked-progress-chip">{{ status }}</div>',
    props: ['status'],
  },
}));

vi.mock('@simpl/vue-components', () => ({
  SProgressBar: {
    name: 'SProgressBar',
    template:
      '<div class="mocked-progress-bar" :id="id" :data-mode="mode" :data-value="value"><slot /></div>',
    props: ['id', 'value', 'mode'],
  },
  SFieldset: {
    name: 'SFieldset',
    template: '<div class="mocked-fieldset" :id="id" :class="$attrs.class"><slot /></div>',
    props: ['id', 'label', 'isExpandable'],
  },
  SStatusMessage: {
    name: 'SStatusMessage',
    template:
      '<div class="mocked-status-message" :id="id" :data-variant="variant" :data-title="title"><slot /></div>',
    props: ['id', 'variant', 'title'],
  },
  ResourceDescriptionRendererHost: {
    name: 'ResourceDescriptionRendererHost',
    template: '<div class="mocked-renderer-host"></div>',
    props: ['input'],
  },
}));

vi.mock('primevue/panel', () => ({
  default: {
    name: 'Panel',
    template:
      '<div class="mocked-panel"><div class="header"><slot name="header" /></div><slot /></div>',
    props: ['header'],
  },
}));

describe('ProgressScreen.vue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const defaultProps = {
    processName: 'test-process',
    title: 'Test Process',
    status: 'In Progress' as const,
    startedAt: new Date('2023-01-01T10:00:00Z').getTime(),
    processDetails: { key: 'value' },
    processError: null,
  };

  it('renders the component', () => {
    const wrapper = mount(ProgressScreen, {
      props: defaultProps,
    });

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('.mocked-panel').exists()).toBe(true);
  });

  it('renders progress bar with correct id attribute', () => {
    const wrapper = mount(ProgressScreen, {
      props: defaultProps,
    });

    const progressBar = wrapper.findComponent({ name: 'SProgressBar' });
    expect(progressBar.attributes('id')).toBe('transfer-progress-bar');
  });

  it('renders error message with correct id when process has error', () => {
    const propsWithError = {
      ...defaultProps,
      status: 'Failed' as const,
      processError: { title: 'Error', description: 'Test error' },
    };

    const wrapper = mount(ProgressScreen, {
      props: propsWithError,
    });

    const errorMessage = wrapper.findComponent({ name: 'SStatusMessage' });
    expect(errorMessage.attributes('id')).toBe('process-error');
  });

  it('displays the title in header', () => {
    const wrapper = mount(ProgressScreen, {
      props: defaultProps,
    });

    expect(wrapper.text()).toContain('Test Process');
  });
});
