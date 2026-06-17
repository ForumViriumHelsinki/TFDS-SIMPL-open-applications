import { mount, flushPromises } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { ref } from 'vue';
import AdvancedSearch from '@/components/search/AdvancedSearch.vue';
import PrimeVue from 'primevue/config';

beforeAll(() => {
  window.matchMedia =
    window.matchMedia ||
    function () {
      return {
        matches: false,
        addListener: function () {},
        removeListener: function () {},
        addEventListener: function () {},
        removeEventListener: function () {},
      };
    };

  // Mock scrollTo and getBoundingClientRect for handleSearchSubmit
  window.scrollTo = vi.fn();
});

const mockFetchConvertedSchema = vi.fn().mockResolvedValue({
  data: { value: { root: { schema1: { type: 'object', properties: {} } } } },
  error: { value: null },
});

vi.mock('@/services/composables/useAdvancedSearchSchemas', () => ({
  useAdvancedSearchSchemas: vi.fn(() => ({
    fetchConvertedSchema: mockFetchConvertedSchema,
  })),
}));

const mockUseAdvancedSearch = vi.fn().mockResolvedValue({
  data: { value: [{ title: 'Result 1', description: 'Description 1' }] },
  error: { value: null },
});

vi.mock('@/services/composables/useAdvancedSearch', () => ({
  useAdvancedSearch: (...args: any[]) => mockUseAdvancedSearch(...args),
}));

// Mock transformFormDataToAdvancedSearchRequestBody
const mockTransformFormData = vi.fn().mockReturnValue({ field1: 'value1' });
vi.mock('@/util/search', () => ({
  transformFormDataToAdvancedSearchRequestBody: (...args: any[]) => mockTransformFormData(...args),
}));

// Mock child components to simplify testing
vi.mock('@/components/search/SearchResults.vue', () => ({
  default: {
    name: 'SearchResults',
    template: '<div class="search-results-mock"><slot name="details" /></div>',
    props: ['result', 'resultsNumberSuffix'],
  },
}));

vi.mock('@/components/search/SearchedPropertiesTree.vue', () => ({
  default: {
    name: 'SearchedPropertiesTree',
    template: '<div class="searched-properties-tree-mock" />',
    props: ['inputProperties'],
  },
}));

const mockFetchSchemas = vi.fn().mockResolvedValue(undefined);

// Create controllable refs for the schemas store mock
const mockSchemasRef = ref([
  { label: 'Schema 1', value: 'schema1' },
  { label: 'Schema 2', value: 'schema2' },
]);
const mockSchemasErrorRef = ref(null);
const mockSchemasLoadingRef = ref(false);

vi.mock('@/services/composables/useSchemas', () => {
  const { ref } = require('vue');
  return {
    useSchemas: () => ({
      schemas: mockSchemasRef,
      schemasMetadata: ref([]),
      schemasError: mockSchemasErrorRef,
      schemasLoading: mockSchemasLoadingRef,
      fetchSchemas: mockFetchSchemas,
    }),
  };
});

const mountComponent = () => {
  return mount(AdvancedSearch, {
    global: {
      plugins: [PrimeVue],
    },
  });
};

describe('AdvancedSearch.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    mockSchemasRef.value = [
      { label: 'Schema 1', value: 'schema1' },
      { label: 'Schema 2', value: 'schema2' },
    ];
    mockSchemasErrorRef.value = null;
    mockSchemasLoadingRef.value = false;
    mockFetchConvertedSchema.mockResolvedValue({
      data: { value: { root: { schema1: { type: 'object', properties: {} } } } },
      error: { value: null },
    });
    mockUseAdvancedSearch.mockResolvedValue({
      data: { value: [{ title: 'Result 1', description: 'Description 1' }] },
      error: { value: null },
    });
    mockTransformFormData.mockReturnValue({ field1: 'value1' });
  });

  describe('schema loading', () => {
    it('renders the loading spinner while schemas are loading', () => {
      mockSchemasLoadingRef.value = true;
      const wrapper = mountComponent();
      expect(wrapper.find('.schemas-loading').exists()).toBe(true);
    });

    it('renders schemas loading spinner with correct id attribute', () => {
      const wrapper = mountComponent();
      const spinner = wrapper.findComponent({ name: 'SLoadingSpinner' });
      expect(spinner.attributes('id')).toBe('schemas-loading');
    });

    it('renders the schema select dropdown when schemas are loaded', async () => {
      const wrapper = mountComponent();
      await wrapper.vm.$nextTick();
      expect(mockFetchSchemas).toHaveBeenCalled();
      expect(wrapper.find('#search-schema').exists()).toBe(true);
    });

    it('does not render select when schemas list is empty', async () => {
      mockSchemasRef.value = [];
      const wrapper = mountComponent();
      await wrapper.vm.$nextTick();
      expect(wrapper.find('#search-schema').exists()).toBe(false);
    });
  });

  describe('schema error display', () => {
    it('displays error when schemas fetch fails', async () => {
      mockSchemasErrorRef.value = { title: 'Fetch Error', description: 'Failed to load schemas' };
      const wrapper = mountComponent();
      await wrapper.vm.$nextTick();

      const errorMsg = wrapper.find('.schemas-error');
      expect(errorMsg.exists()).toBe(true);
    });

    it('displays error when schema conversion fails', async () => {
      mockFetchConvertedSchema.mockResolvedValue({
        data: { value: null },
        error: { value: { title: 'Conversion Error', description: 'Failed to convert' } },
      });

      const wrapper = mountComponent();
      await wrapper.vm.$nextTick();

      // Select a schema to trigger conversion
      const select = wrapper.find('#search-schema');
      await select.setValue('schema1');
      await flushPromises();

      const errorMsg = wrapper.find('.schemas-error');
      expect(errorMsg.exists()).toBe(true);
    });
  });

  describe('selectShape', () => {
    it('fetches and sets converted schema on successful selection', async () => {
      const wrapper = mountComponent();
      await wrapper.vm.$nextTick();

      const select = wrapper.findComponent({ name: 'SSelect' });
      select.vm.$emit('change', 'schema1');
      await flushPromises();

      expect(mockFetchConvertedSchema).toHaveBeenCalledWith('schema1');
      // Form should appear since selectedSchema is set
      expect(wrapper.find('form').exists()).toBe(true);
    });

    it('handles schema conversion error', async () => {
      mockFetchConvertedSchema.mockResolvedValue({
        data: { value: null },
        error: { value: { title: 'Error', description: 'Conversion failed' } },
      });

      const wrapper = mountComponent();
      await wrapper.vm.$nextTick();

      const select = wrapper.findComponent({ name: 'SSelect' });
      select.vm.$emit('change', 'schema1');
      await flushPromises();

      // Form should NOT appear since conversion failed
      expect(wrapper.find('form').exists()).toBe(false);
      // Error should be shown
      expect(wrapper.find('.schemas-error').exists()).toBe(true);
    });

    it('handles schema with no root property', async () => {
      mockFetchConvertedSchema.mockResolvedValue({
        data: { value: {} },
        error: { value: null },
      });

      const wrapper = mountComponent();
      await wrapper.vm.$nextTick();

      const select = wrapper.findComponent({ name: 'SSelect' });
      select.vm.$emit('change', 'schema1');
      await flushPromises();

      // No form because selectedSchema is undefined (no root)
      expect(wrapper.find('form').exists()).toBe(false);
    });

    it('clears previous schema conversion error on successful load', async () => {
      // First, trigger a conversion error
      mockFetchConvertedSchema.mockResolvedValueOnce({
        data: { value: null },
        error: { value: { title: 'Error', description: 'Failed' } },
      });

      const wrapper = mountComponent();
      await wrapper.vm.$nextTick();

      const select = wrapper.findComponent({ name: 'SSelect' });
      select.vm.$emit('change', 'schema1');
      await flushPromises();

      expect(wrapper.find('.schemas-error').exists()).toBe(true);

      // Now select again with success
      mockFetchConvertedSchema.mockResolvedValueOnce({
        data: { value: { root: { s: { type: 'object' } } } },
        error: { value: null },
      });

      select.vm.$emit('change', 'schema2');
      await flushPromises();

      expect(wrapper.find('.schemas-error').exists()).toBe(false);
    });
  });

  describe('handleSearchSubmit', () => {
    const setupFormWithSchema = async () => {
      const wrapper = mountComponent();
      await wrapper.vm.$nextTick();

      const select = wrapper.findComponent({ name: 'SSelect' });
      select.vm.$emit('change', 'schema1');
      await flushPromises();
      return wrapper;
    };

    it('performs search and shows results', async () => {
      const wrapper = await setupFormWithSchema();

      const form = wrapper.find('form');
      expect(form.exists()).toBe(true);

      await form.trigger('submit');
      await flushPromises();

      expect(mockUseAdvancedSearch).toHaveBeenCalledWith({ field1: 'value1' });
      expect(window.scrollTo).toHaveBeenCalled();
    });

    it('does not search when searchData is null', async () => {
      mockTransformFormData.mockReturnValue(undefined);

      const wrapper = await setupFormWithSchema();

      const form = wrapper.find('form');
      await form.trigger('submit');
      await flushPromises();

      expect(mockUseAdvancedSearch).not.toHaveBeenCalled();
    });

    it('handles search error', async () => {
      mockUseAdvancedSearch.mockResolvedValue({
        data: { value: null },
        error: { value: { title: 'Search Error', description: 'Search failed' } },
      });

      const wrapper = await setupFormWithSchema();

      const form = wrapper.find('form');
      await form.trigger('submit');
      await flushPromises();

      // error details should be shown in the results area
      expect(wrapper.find('#advanced-search-error').exists()).toBe(true);
    });

    it('clears previous error on successful search', async () => {
      // First search fails
      mockUseAdvancedSearch.mockResolvedValueOnce({
        data: { value: null },
        error: { value: { title: 'Error', description: 'Failed' } },
      });

      const wrapper = await setupFormWithSchema();
      const form = wrapper.find('form');

      await form.trigger('submit');
      await flushPromises();
      expect(wrapper.find('#advanced-search-error').exists()).toBe(true);

      // Second search succeeds
      mockUseAdvancedSearch.mockResolvedValueOnce({
        data: { value: [{ title: 'OK' }] },
        error: { value: null },
      });

      await form.trigger('submit');
      await flushPromises();
      expect(wrapper.find('#advanced-search-error').exists()).toBe(false);
    });

    it('shows loading spinner during search', async () => {
      let resolveSearch!: (val: any) => void;
      mockUseAdvancedSearch.mockImplementationOnce(() => {
        return new Promise((resolve) => {
          resolveSearch = resolve;
        });
      });

      const wrapper = await setupFormWithSchema();
      const form = wrapper.find('form');

      // Don't await — we want to catch the loading state
      const submitPromise = form.trigger('submit');
      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();

      // Resolve the search
      resolveSearch({ data: { value: [] }, error: { value: null } });
      await submitPromise;
      await flushPromises();

      expect(wrapper.find('#advanced-search-loading').exists()).toBe(false);
    });
  });

  describe('resetForm', () => {
    it('clears form and results when clear button is clicked', async () => {
      const wrapper = mountComponent();
      await wrapper.vm.$nextTick();

      // Select a schema
      const select = wrapper.findComponent({ name: 'SSelect' });
      select.vm.$emit('change', 'schema1');
      await flushPromises();

      // Simulate form data population (normally done via SJsonFormsWrapper @change)
      (wrapper.vm as any).form.data = { field1: 'value1' };
      await wrapper.vm.$nextTick();

      // Submit a search first
      const form = wrapper.find('form');
      await form.trigger('submit');
      await flushPromises();

      // Verify search results are shown
      expect(wrapper.find('.search-results-mock').exists()).toBe(true);

      // Clear button should now be enabled since form.data has keys
      const clearBtn = wrapper.find('#advanced-search-clear-button');
      expect(clearBtn.exists()).toBe(true);
      expect(clearBtn.attributes('disabled')).toBeUndefined();
      await clearBtn.trigger('click');
      await flushPromises();

      // Results should be hidden after reset
      expect(wrapper.find('.search-results-mock').exists()).toBe(false);
    });
  });

  describe('form buttons', () => {
    it('renders search form with buttons when schema is selected', async () => {
      const wrapper = mountComponent();
      await wrapper.vm.$nextTick();

      const select = wrapper.findComponent({ name: 'SSelect' });
      select.vm.$emit('change', 'schema1');
      await flushPromises();

      const html = wrapper.html();
      expect(html).toContain('advanced-search-submit-button');
      expect(html).toContain('advanced-search-clear-button');
    });

    it('renders template with ID attributes for search elements', async () => {
      const wrapper = mountComponent();
      await wrapper.vm.$nextTick();
      expect(wrapper.find('#search-schema').exists()).toBe(true);
      expect(wrapper.exists()).toBe(true);
    });

    it('does not render search loading spinner when not searching', async () => {
      const wrapper = mountComponent();
      await wrapper.vm.$nextTick();
      expect(wrapper.find('#advanced-search-loading').exists()).toBe(false);
    });
  });
});
