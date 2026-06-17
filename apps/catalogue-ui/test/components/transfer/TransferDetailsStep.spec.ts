import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import TransferDetailsStep from '@/components/transfer/TransferDetailsStep.vue';

// Mock child components
vi.mock('primevue/panel', () => ({
  default: {
    name: 'Panel',
    template: '<div class="mocked-panel" :data-header="header"><slot /></div>',
    props: ['header'],
  },
}));

vi.mock('@/components/transfer/ResourceSharingMethod.vue', () => ({
  default: {
    name: 'ResourceSharingMethod',
    template: '<div class="mocked-resource-sharing-method">Resource Sharing Method</div>',
  },
}));

describe('TransferDetailsStep.vue', () => {
  it('renders the component', () => {
    const wrapper = mount(TransferDetailsStep);

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('.mocked-panel').exists()).toBe(true);
  });

  it('renders panel with correct header', () => {
    const wrapper = mount(TransferDetailsStep);

    const panel = wrapper.find('.mocked-panel');
    expect(panel.attributes('data-header')).toBe('Transfer Details');
  });

  it('displays description text', () => {
    const wrapper = mount(TransferDetailsStep);

    expect(wrapper.text()).toContain('Provide the necessary information about the location');
    expect(wrapper.text()).toContain('to which you want the resource to be transferred');
  });

  it('renders ResourceSharingMethod component', () => {
    const wrapper = mount(TransferDetailsStep);

    expect(wrapper.find('.mocked-resource-sharing-method').exists()).toBe(true);
    expect(wrapper.text()).toContain('Resource Sharing Method');
  });

  it('has correct component structure', () => {
    const wrapper = mount(TransferDetailsStep);

    // Panel should contain the description and ResourceSharingMethod
    const panel = wrapper.find('.mocked-panel');
    expect(panel.exists()).toBe(true);

    // Check that both description and ResourceSharingMethod are within the panel
    const panelContent = panel.text();
    expect(panelContent).toContain('Provide the necessary information');
    expect(panelContent).toContain('Resource Sharing Method');
  });
});
