import { describe, it, expect, vi } from 'vitest';
import { ref } from 'vue';

// Mock all dependencies to avoid complex store interactions
vi.mock('@/stores', () => ({
  useDataTransferWizardStore: vi.fn(() => ({
    goNextStep: vi.fn(),
    closeOverlay: vi.fn(),
  })),
  useResourceDescriptionStore: vi.fn(() => ({
    setResourceDescriptionDocument: vi.fn(),
  })),
}));

vi.mock('pinia', () => ({
  storeToRefs: vi.fn(() => ({
    resourceDescriptionSummary: ref({ title: 'Test Resource' }),
    steps: ref([{ isNextStepAvailable: true, nextStepLabel: 'Next', nextStepIcon: 'arrow-forward' }]),
    step: ref(0),
    isOverlayVisible: ref(true),
  })),
}));

vi.mock('@simpl/vue-components', () => ({
  SOverlay: {
    name: 'SOverlay',
    template: '<div class="mocked-overlay" :id="id"><slot /><slot name="footer" /></div>',
    props: ['id', 'modelValue', 'title'],
  },
  SButton: {
    name: 'SButton',
    template: '<button class="mocked-button" :id="id">{{ label }}</button>',
    props: ['id', 'label', 'severity', 'icon', 'iconPos', 'disabled'],
  },
}));

vi.mock('@/components/transfer/DataTransferWizard.vue', () => ({
  default: {
    name: 'DataTransferWizard',
    template: '<div class="mocked-wizard"></div>',
  },
}));

describe('DataTransferOverlay.vue', () => {
  it('can be imported without errors', async () => {
    const { default: DataTransferOverlay } =
      await import('@/components/transfer/DataTransferOverlay.vue');
    expect(DataTransferOverlay).toBeDefined();
  });

  it('has the correct component name', async () => {
    const { default: DataTransferOverlay } =
      await import('@/components/transfer/DataTransferOverlay.vue');
    expect(DataTransferOverlay.__name || DataTransferOverlay.name).toBeTruthy();
  });

  it('renders overlay with correct id', async () => {
    const { default: DataTransferOverlay } =
      await import('@/components/transfer/DataTransferOverlay.vue');
    const { mount } = await import('@vue/test-utils');
    
    const wrapper = mount(DataTransferOverlay, {
      props: {
        document: { title: 'Test Document' },
      },
    });
    
    const html = wrapper.html();
    expect(html).toContain('id="data-transfer-overlay"');
  });

  it('renders buttons with correct ids', async () => {
    const { default: DataTransferOverlay } =
      await import('@/components/transfer/DataTransferOverlay.vue');
    const { mount } = await import('@vue/test-utils');
    
    const wrapper = mount(DataTransferOverlay, {
      props: {
        document: { title: 'Test Document' },
      },
    });
    
    const html = wrapper.html();
    expect(html).toContain('id="transfer-wizard-cancel-button"');
    expect(html).toContain('id="transfer-wizard-next-button"');
  });
});
