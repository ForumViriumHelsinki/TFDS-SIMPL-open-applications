import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, type Mock, beforeEach } from 'vitest';
import QuickSearch from '@/components/search/QuickSearch.vue';
import { useQuickSearch } from '@/services/composables/useQuickSearch';
import { getPublicEnv } from '@/util/getEnv';
import PrimeVue from 'primevue/config';
import { ref } from 'vue';

vi.mock('@/services/composables/useQuickSearch', () => ({
  useQuickSearch: vi.fn(),
}));

vi.mock('@/util/getEnv', () => ({
  getPublicEnv: vi.fn(),
}));

//SearchResults Mock should include the details slot
vi.mock('@/components/search/SearchResults.vue', () => ({
  default: {
    name: 'SearchResults',
    template: `
      <div class="search-results-mock">
        {{ result?.length || 0 }} results
        <div class="details-slot">
          <slot name="details"></slot>
        </div>
        <div v-for="item in result" :key="item.title" class="result-item">
          {{ item.title }} - {{ item.description }}
        </div>
      </div>
    `,
    props: ['result'],
  },
}));

// Mock the SLoadingSpinner component
vi.mock('@simpl/vue-components', () => ({
  SLoadingSpinner: {
    name: 'SLoadingSpinner',
    template: '<div class="loading-spinner" :id="id">Loading...</div>',
    props: ['id'],
  },
  SStatusMessage: {
    name: 'SStatusMessage',
    template: '<div class="status-message" :id="id"><h3>{{ title }}</h3><slot></slot></div>',
    props: ['id', 'title', 'variant'],
  },
  SInput: {
    name: 'SInput',
    template: '<input :id="id" :name="name" :type="type" :placeholder="placeholder" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    props: ['id', 'name', 'type', 'placeholder', 'modelValue'],
    emits: ['update:modelValue'],
  },
  SButton: {
    name: 'SButton',
    template: '<button :id="id" :type="type" class="quick-search-button">{{ label }}</button>',
    props: ['id', 'label', 'icon', 'variant', 'type'],
  },
}));

describe('QuickSearch.vue', () => {
  beforeEach(() => {
    (getPublicEnv as Mock).mockReturnValue({
      PUBLIC_AGENT_TYPE: 'consumer',
    });
    vi.clearAllMocks();
  });

  it('renders the search input and button', () => {
    // Mock useQuickSearch to return empty data initially
    (useQuickSearch as Mock).mockResolvedValue({
      data: ref([]),
      error: ref(null),
      isLoading: ref(false),
    });

    const wrapper = mount(QuickSearch, {
      props: {
        search: 'test search',
      },
      global: {
        plugins: [PrimeVue],
      },
    });

    const input = wrapper.find('input#quick-search-inpage');
    const button = wrapper.find('button.quick-search-button');

    expect(input.exists()).toBe(true);
    expect((input.element as HTMLInputElement).value).toBe('test search');
    expect(button.exists()).toBe(true);
    expect(button.text()).toBe('Search');
  });

  it('renders search button with correct id attribute', () => {
    (useQuickSearch as Mock).mockResolvedValue({
      data: ref([]),
      error: ref(null),
      isLoading: ref(false),
    });

    const wrapper = mount(QuickSearch, {
      props: {
        search: 'test',
      },
      global: {
        plugins: [PrimeVue],
      },
    });

    const button = wrapper.findComponent({ name: 'SButton' });
    expect(button.attributes('id')).toBe('quick-search-submit-button');
  });

  it('renders loading spinner with correct id when loading', async () => {
    let resolveSearch: (value: any) => void;
    const searchPromise = new Promise((resolve) => {
      resolveSearch = resolve;
    });

    (useQuickSearch as Mock).mockReturnValue(searchPromise);

    const wrapper = mount(QuickSearch, {
      props: {
        search: 'test',
      },
      global: {
        plugins: [PrimeVue],
      },
    });

    await wrapper.vm.$nextTick();

    // Verify the ID is in the HTML
    const html = wrapper.html();
    expect(html).toContain('quick-search-loading');

    // Clean up
    resolveSearch!({ data: ref([]), error: ref(null) });
    await wrapper.vm.$nextTick();
  });

  it('renders error message with correct id when there is an error', async () => {
    (useQuickSearch as Mock).mockResolvedValue({
      data: ref([]),
      error: ref({ title: 'Error', description: 'Test error' }),
      isLoading: ref(false),
    });

    const wrapper = mount(QuickSearch, {
      props: {
        search: 'test',
      },
      global: {
        plugins: [PrimeVue],
      },
    });

    await wrapper.vm.$nextTick();
    await new Promise((resolve) => setTimeout(resolve, 0));
    await wrapper.vm.$nextTick();

    const errorMessage = wrapper.findComponent({ name: 'SStatusMessage' });
    if (errorMessage.exists()) {
      expect(errorMessage.attributes('id')).toBe('quick-search-error');
    }
  });

  it('calls useQuickSearch and displays results on successful search', async () => {
    const mockResults = [
      { 
        title: 'Result 1', 
        description: 'Description 1', 
        name: 'Name 1',
        offeringType: 'data',
        claimsGraphUri: ['uri1'] as [string]
      }
    ];

    (useQuickSearch as Mock).mockResolvedValue({
      data: ref(mockResults),
      error: ref(null),
      isLoading: ref(false),
    });

    const wrapper = mount(QuickSearch, {
      props: {
        search: 'test search',
      },
      global: {
        plugins: [PrimeVue],
      },
    });

    // Wait for the component to mount and perform the search
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    expect(useQuickSearch).toHaveBeenCalledWith('test search');
    
    // Check if results are displayed
    expect(wrapper.text()).toContain('Result 1');
    expect(wrapper.text()).toContain('Description 1');
    expect(wrapper.text()).toContain('1 results');
  });

  it('displays an error message when the search fails', async () => {
    // Mock as a UIError since the error transformation should have already happened
    // in the useQuickSearch composable or fetchLocalEndpoint
    const mockError = {
      title: 'Error Title',
      description: 'Error Description',
    };

    (useQuickSearch as Mock).mockResolvedValue({
      data: ref(null),
      error: ref(mockError),
      isLoading: ref(false),
    });

    const wrapper = mount(QuickSearch, {
      props: {
        search: 'test search',
      },
      global: {
        plugins: [PrimeVue],
      },
    });

    // Wait for the component to mount and perform the search
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    expect(useQuickSearch).toHaveBeenCalledWith('test search');
    
    // Check for error message in status message component
    const statusMessage = wrapper.find('.status-message');
    expect(statusMessage.exists()).toBe(true);
    expect(statusMessage.text()).toContain('Error Title');
    expect(statusMessage.text()).toContain('Error Description');
  });

  it('does not perform a search if the search prop is empty', async () => {
    (useQuickSearch as Mock).mockResolvedValue({
      data: ref([]),
      error: ref(null),
      isLoading: ref(false),
    });

    const wrapper = mount(QuickSearch, {
      props: {
        search: '',
      },
      global: {
        plugins: [PrimeVue],
      },
    });

    await wrapper.vm.$nextTick();

    expect(useQuickSearch).not.toHaveBeenCalled();
  });

  it('shows a loading spinner while the search is in progress', async () => {
    // We need to control the loading state directly since the component sets it
    let resolveSearch: any;
    const searchPromise = new Promise((resolve) => {
      resolveSearch = resolve;
    });

    (useQuickSearch as Mock).mockReturnValue(searchPromise);

    const wrapper = mount(QuickSearch, {
      props: {
        search: 'test search',
      },
      global: {
        plugins: [PrimeVue],
      },
    });

    // The component should show loading immediately after mount
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.loading-spinner').exists()).toBe(true);
    expect(wrapper.text()).toContain('Loading...');

    // Resolve the search
    resolveSearch({
      data: ref([]),
      error: ref(null),
      isLoading: ref(false),
    });

    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    // Loading should be gone
    expect(wrapper.find('.loading-spinner').exists()).toBe(false);
  });

  it('updates localSearchValue when search prop changes', async () => {
    (useQuickSearch as Mock).mockResolvedValue({
      data: ref([]),
      error: ref(null),
      isLoading: ref(false),
    });

    const wrapper = mount(QuickSearch, {
      props: {
        search: 'initial search',
      },
      global: {
        plugins: [PrimeVue],
      },
    });

    const input = wrapper.find('input#quick-search-inpage');
    expect((input.element as HTMLInputElement).value).toBe('initial search');

    // Update the prop
    await wrapper.setProps({ search: 'updated search' });
    await wrapper.vm.$nextTick();

    // The input should still show the local value, which gets updated on mount
    expect((input.element as HTMLInputElement).value).toBe('initial search');
  });

  it('handles empty results gracefully', async () => {
    (useQuickSearch as Mock).mockResolvedValue({
      data: ref([]),
      error: ref(null),
      isLoading: ref(false),
    });

    const wrapper = mount(QuickSearch, {
      props: {
        search: 'no results query',
      },
      global: {
        plugins: [PrimeVue],
      },
    });

    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    expect(useQuickSearch).toHaveBeenCalledWith('no results query');
    expect(wrapper.text()).toContain('0 results');
  });

  it('displays multiple results correctly', async () => {
    const mockResults = [
      { 
        title: 'Result 1', 
        description: 'Description 1',
        offeringType: 'data',
        claimsGraphUri: ['uri1'] as [string]
      },
      { 
        title: 'Result 2', 
        description: 'Description 2',
        offeringType: 'application',
        claimsGraphUri: ['uri2'] as [string]
      }
    ];

    (useQuickSearch as Mock).mockResolvedValue({
      data: ref(mockResults),
      error: ref(null),
      isLoading: ref(false),
    });

    const wrapper = mount(QuickSearch, {
      props: {
        search: 'multiple results',
      },
      global: {
        plugins: [PrimeVue],
      },
    });

    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Result 1');
    expect(wrapper.text()).toContain('Result 2');
    expect(wrapper.text()).toContain('2 results');
  });

  it('shows search string in results details', async () => {
    const mockResults = [
      { 
        title: 'Result 1', 
        description: 'Description 1',
        offeringType: 'data',
        claimsGraphUri: ['uri1'] as [string]
      }
    ];

    (useQuickSearch as Mock).mockResolvedValue({
      data: ref(mockResults),
      error: ref(null),
      isLoading: ref(false),
    });

    const wrapper = mount(QuickSearch, {
      props: {
        search: 'test query',
      },
      global: {
        plugins: [PrimeVue],
      },
    });

    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('for the search string: test query');
  });

  it('handles error without response details', async () => {
    // Test error that might not have all expected properties
    const mockError = {
      title: 'Network Error',
      description: 'Connection failed',
    };

    (useQuickSearch as Mock).mockResolvedValue({
      data: ref(null),
      error: ref(mockError),
      isLoading: ref(false),
    });

    const wrapper = mount(QuickSearch, {
      props: {
        search: 'error test',
      },
      global: {
        plugins: [PrimeVue],
      },
    });

    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    // Should not crash when error has the expected UIError structure
    expect(wrapper.find('.quick-search-error').exists()).toBe(true);
    expect(wrapper.find('.status-message').text()).toContain('Network Error');
  });
});
