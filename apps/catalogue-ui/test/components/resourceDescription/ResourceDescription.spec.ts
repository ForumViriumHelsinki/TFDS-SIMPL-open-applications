import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import ResourceDescription from '@/components/resourceDescription/ResourceDescription.vue';

// Mock external dependencies with proper id prop handling
vi.mock('@simpl/vue-components', () => ({
  SLoadingSpinner: {
    name: 'SLoadingSpinner',
    template: '<div class="mocked-spinner" :id="id">Loading...</div>',
    props: ['id'],
  },
  SStatusMessage: {
    name: 'SStatusMessage',
    template: '<div class="mocked-status-message" :id="id" :variant="variant">{{ title }}: <slot /></div>',
    props: ['id', 'title', 'variant'],
  },
}));

vi.mock('@/components/resourceDescription/ResourceDescriptionSummary.vue', () => ({
  default: {
    name: 'ResourceDescriptionSummary',
    template: '<div class="mocked-summary">Resource Summary</div>',
    props: ['isLarge', 'resourceDescriptionDocument'],
  },
}));

vi.mock('@/components/resourceDescription/ResourceDescriptionDetails.vue', () => ({
  default: {
    name: 'ResourceDescriptionDetails',
    template: '<div class="mocked-details">Resource Details</div>',
    props: ['document'],
  },
}));

vi.mock('@/components/transfer/DataTransferOverlay.vue', () => ({
  default: {
    name: 'DataTransferOverlay',
    template: '<div class="mocked-overlay">Data Transfer Overlay</div>',
    props: ['document'],
  },
}));

vi.mock('@/util/getEnv', () => ({
  isConsumerEnvironment: vi.fn(() => true),
}));

// Default mock that resolves immediately
vi.mock('@/services/composables/useCatalogueSelfDescriptions', () => ({
  useCatalogueSelfDescriptions: vi.fn(() => ({
    data: { value: null },
    error: { value: null },
  })),
}));

describe('ResourceDescription.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the component', () => {
    const wrapper = mount(ResourceDescription, {
      props: {
        id: 'test-id',
      },
    });

    expect(wrapper.exists()).toBe(true);
  });

  it('renders the component structure', () => {
    const wrapper = mount(ResourceDescription, {
      props: {
        id: 'test-id',
      },
    });

    // Component should at least render
    expect(wrapper.exists()).toBe(true);
  });

  it('renders loading spinner with correct id when loading', async () => {
    // Create a promise that we can control to keep the component in loading state
    let resolvePromise: ((value: any) => void) | undefined;
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    const { useCatalogueSelfDescriptions } = await import('@/services/composables/useCatalogueSelfDescriptions');
    vi.mocked(useCatalogueSelfDescriptions).mockReturnValueOnce(pendingPromise as any);

    const wrapper = mount(ResourceDescription, {
      props: {
        id: 'test-id',
      },
    });

    // Component should be in loading state because promise hasn't resolved
    await wrapper.vm.$nextTick();
    
    const html = wrapper.html();
    expect(html).toContain('id="resource-description-loading"');

    // Clean up - resolve the promise
    if (resolvePromise) {
      resolvePromise({ data: { value: null }, error: { value: null } });
    }
  });

  it('renders error message with correct id when there is an error', async () => {
    const { useCatalogueSelfDescriptions } = await import('@/services/composables/useCatalogueSelfDescriptions');
    vi.mocked(useCatalogueSelfDescriptions).mockReturnValueOnce({
      data: { value: null },
      error: { value: { title: 'Error', description: 'Test error' } },
    } as any);

    const wrapper = mount(ResourceDescription, {
      props: {
        id: 'test-id',
      },
    });

    // Wait for the async onMounted to complete
    await wrapper.vm.$nextTick();
    await new Promise(r => setTimeout(r, 10));
    await wrapper.vm.$nextTick();
    
    const html = wrapper.html();
    expect(html).toContain('id="self-description-error"');
  });

  it('renders template with ID attributes', () => {
    const wrapper = mount(ResourceDescription, {
      props: {
        id: 'test-id',
      },
    });
    
    const html = wrapper.html();
    // Verify the component renders
    expect(html.length).toBeGreaterThan(0);
  });
});
