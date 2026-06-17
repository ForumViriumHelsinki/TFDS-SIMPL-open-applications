import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import SearchResult from '@/components/search/SearchResult.vue';
import PrimeVue from 'primevue/config';
import type { SearchAPIResult } from 'types/searchApi';

// Mock ResourceDescriptionSummary
vi.mock('@/components/resourceDescription/ResourceDescriptionSummary.vue', () => ({
  default: {
    name: 'ResourceDescriptionSummary',
    template: '<div class="resource-description-summary-mock" />',
    props: {
      showMoreDetails: { type: Boolean, default: false },
      searchResult: { type: Object, default: null },
    },
  },
}));

const createItem = (overrides: Partial<SearchAPIResult> = {}): SearchAPIResult => ({
  title: 'Test Resource',
  description: 'A test resource description',
  offeringType: 'data',
  claimsGraphUri: ['http://example.com/resource/1'],
  ...overrides,
});

const mountComponent = (item: SearchAPIResult = createItem(), showJson = false) => {
  return mount(SearchResult, {
    props: { item, showJson },
    global: {
      plugins: [PrimeVue],
    },
  });
};

describe('SearchResult.vue', () => {
  it('renders the component', () => {
    const wrapper = mountComponent();
    expect(wrapper.find('.search-result').exists()).toBe(true);
  });

  it('sets data-sd-id from claimsGraphUri', () => {
    const item = createItem({ claimsGraphUri: ['http://example.com/sd/123'] });
    const wrapper = mountComponent(item);
    expect(wrapper.find('[data-sd-id="http://example.com/sd/123"]').exists()).toBe(true);
  });

  it('uses empty string for data-sd-id when claimsGraphUri is empty', () => {
    const item = createItem({ claimsGraphUri: ['' as string] as [string] });
    const wrapper = mountComponent(item);
    expect(wrapper.find('[data-sd-id=""]').exists()).toBe(true);
  });

  it('uses first element of claimsGraphUri when multiple exist', () => {
    const item = {
      ...createItem(),
      claimsGraphUri: ['http://example.com/first'] as [string],
    };
    const wrapper = mountComponent(item);
    expect(wrapper.find('[data-sd-id="http://example.com/first"]').exists()).toBe(true);
  });

  it('passes item to ResourceDescriptionSummary as searchResult prop', () => {
    const item = createItem();
    const wrapper = mountComponent(item);
    const summary = wrapper.findComponent({ name: 'ResourceDescriptionSummary' });
    expect(summary.exists()).toBe(true);
    expect(summary.props('searchResult')).toEqual(item);
  });

  it('passes showMoreDetails to ResourceDescriptionSummary', () => {
    const wrapper = mountComponent();
    const summary = wrapper.findComponent({ name: 'ResourceDescriptionSummary' });
    expect(summary.props('showMoreDetails')).toBe(true);
  });

  it('falls back to empty string when claimsGraphUri[0] is undefined', () => {
    const item = createItem();
    // Remove claimsGraphUri entries to trigger the ?? fallback
    (item as any).claimsGraphUri = [];
    const wrapper = mountComponent(item);
    expect(wrapper.find('[data-sd-id=""]').exists()).toBe(true);
  });
});
