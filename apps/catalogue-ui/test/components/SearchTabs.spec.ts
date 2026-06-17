import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import SearchTabs from '@/components/search/SearchTabs.vue';
import PrimeVue from 'primevue/config';

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock QuickSearch and AdvancedSearch components
vi.mock('@/components/search/QuickSearch.vue', () => ({
  default: {
    template: '<div class="quick-search-mock"></div>',
  },
}));

vi.mock('@/components/search/AdvancedSearch.vue', () => ({
  default: {
    template: '<div class="advanced-search-mock"></div>',
  },
}));

describe('SearchTabs.vue', () => {
  it('renders the tabs correctly', () => {
    const wrapper = mount(SearchTabs, {
      props: {
        search: 'test search',
      },
      global: {
        plugins: [PrimeVue],
      },
    });

    // Check if the tabs are rendered
    expect(wrapper.text()).toContain('Quick search');
    expect(wrapper.text()).toContain('Advanced search');
  });

  it('renders QuickSearch in the quick-search tab', () => {
    const wrapper = mount(SearchTabs, {
      props: {
        search: 'test search',
      },
      global: {
        plugins: [PrimeVue],
      },
    });

    // Check if QuickSearch is rendered in the quick-search tab
    const quickSearch = wrapper.find('.quick-search-mock');
    expect(quickSearch.exists()).toBe(true);
  });

  it('renders AdvancedSearch in the advanced-search tab', () => {
    const wrapper = mount(SearchTabs, {
      props: {
        search: 'test search',
      },
      global: {
        plugins: [PrimeVue],
      },
    });

    // Check if AdvancedSearch is rendered in the advanced-search tab
    const advancedSearch = wrapper.find('.advanced-search-mock');
    expect(advancedSearch.exists()).toBe(true);
  });

  it('renders STabs with correct id attribute', () => {
    const wrapper = mount(SearchTabs, {
      props: {
        search: 'test search',
      },
      global: {
        plugins: [PrimeVue],
      },
    });

    const tabs = wrapper.findComponent({ name: 'STabs' });
    expect(tabs.attributes('id')).toBe('search-tabs');
  });
});
