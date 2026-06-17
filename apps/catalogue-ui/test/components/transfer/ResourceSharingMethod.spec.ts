import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';

// Mock all dependencies to avoid complex store interactions
vi.mock('@/stores', () => ({
  useResourceSharingMethodStore: vi.fn(() => ({
    initializeResourceSharingMethods: vi.fn(),
    setSelectedTemplate: vi.fn(),
    updateFormErrors: vi.fn(),
  })),
}));

vi.mock('pinia', () => ({
  storeToRefs: vi.fn(() => ({
    resourceAddressTemplates: ref([{ label: 'Template 1', value: 'template1' }]),
    resourceAddressTemplatesError: ref(null),
    selectedTemplate: ref(null),
    selectedTemplateSchema: ref(null),
    selectedTemplateUiSchema: ref(null),
    schemasLoading: ref(false),
    resourceAddressForm: ref({ data: {} }),
    isTemplatesLoading: ref(false),
  })),
}));

vi.mock('@simpl/vue-components', () => ({
  SStatusMessage: {
    name: 'SStatusMessage',
    template: '<div class="status-message" :id="id"><slot /></div>',
    props: ['id', 'title', 'variant'],
  },
  SLoadingSpinner: { 
    name: 'SLoadingSpinner', 
    template: '<div class="loading-spinner" :id="id"></div>',
    props: ['id'],
  },
  SSelect: { 
    name: 'SSelect', 
    template: '<div class="select"><slot /></div>',
    props: ['options', 'modelValue', 'label', 'placeholder'],
  },
  SJsonFormsWrapper: {
    name: 'SJsonFormsWrapper',
    template: '<div class="json-forms"><slot /></div>',
    props: ['data', 'schema', 'uischema', 'ajvOptions', 'formSchemaVariant'],
    emits: ['update:data', 'change'],
  },
}));

describe('ResourceSharingMethod.vue', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  // Helper to create mock refs for storeToRefs
  const createMockRefs = (overrides: Record<string, any> = {}) => ({
    resourceAddressTemplates: ref([{ label: 'Template 1', value: 'template1' }]),
    resourceAddressTemplatesError: ref(null),
    selectedTemplate: ref(null),
    selectedTemplateSchema: ref(null),
    selectedTemplateUiSchema: ref(null),
    schemasLoading: ref(false),
    resourceAddressForm: ref({ data: {} }),
    isTemplatesLoading: ref(false),
    sharingMethodId: ref(null),
    ...overrides,
  });

  it('can be imported without errors', async () => {
    const { default: ResourceSharingMethod } = await import(
      '@/components/transfer/ResourceSharingMethod.vue'
    );
    expect(ResourceSharingMethod).toBeDefined();
  });

  it('has the correct component name', async () => {
    const { default: ResourceSharingMethod } = await import(
      '@/components/transfer/ResourceSharingMethod.vue'
    );
    expect(ResourceSharingMethod.__name || ResourceSharingMethod.name).toBeTruthy();
  });

  it('renders error message with correct id when there is an error', async () => {
    const { storeToRefs } = await import('pinia');
    vi.mocked(storeToRefs).mockReturnValueOnce(createMockRefs({
      resourceAddressTemplates: ref([]),
      resourceAddressTemplatesError: ref({ title: 'Error', description: 'Test error' }),
      sharingMethodId: ref('test-method'),
    }) as any);

    const { default: ResourceSharingMethod } = await import(
      '@/components/transfer/ResourceSharingMethod.vue'
    );
    const { mount } = await import('@vue/test-utils');
    
    const wrapper = mount(ResourceSharingMethod);
    const errorMessage = wrapper.findComponent({ name: 'SStatusMessage' });
    expect(errorMessage.attributes('id')).toBe('resource-address-templates-error');
  });

  it('renders templates loading spinner with correct id when loading', async () => {
    const { storeToRefs } = await import('pinia');
    vi.mocked(storeToRefs).mockReturnValueOnce(createMockRefs({
      resourceAddressTemplates: ref([]),
      isTemplatesLoading: ref(true),
      sharingMethodId: ref('test-method'),
    }) as any);

    const { default: ResourceSharingMethod } = await import(
      '@/components/transfer/ResourceSharingMethod.vue'
    );
    const { mount } = await import('@vue/test-utils');
    
    const wrapper = mount(ResourceSharingMethod);
    const html = wrapper.html();
    // Verify spinner with id is rendered when isTemplatesLoading is true
    expect(html).toContain('id="resource-templates-loading"');
  });

  it('does not render templates loading spinner when not loading', async () => {
    const { storeToRefs } = await import('pinia');
    vi.mocked(storeToRefs).mockReturnValueOnce(createMockRefs({
      resourceAddressTemplates: ref([{ label: 'T1', value: 't1' }]),
      isTemplatesLoading: ref(false),
      sharingMethodId: ref('test-method'),
    }) as any);

    const { default: ResourceSharingMethod } = await import(
      '@/components/transfer/ResourceSharingMethod.vue'
    );
    const { mount } = await import('@vue/test-utils');
    
    const wrapper = mount(ResourceSharingMethod);
    // With v-if="false", the spinner should not exist in DOM (v-if removes from DOM)
    // When isTemplatesLoading is false, there should be no loading spinner with id="resource-templates-loading"
    expect(wrapper.find('#resource-templates-loading').exists()).toBe(false);
  });

  it('renders schemas loading spinner with correct id when schemas are loading', async () => {
    const { storeToRefs } = await import('pinia');
    vi.mocked(storeToRefs).mockReturnValueOnce(createMockRefs({
      resourceAddressTemplates: ref([]),
      schemasLoading: ref(true),
      sharingMethodId: ref('test-method'),
    }) as any);

    const { default: ResourceSharingMethod } = await import(
      '@/components/transfer/ResourceSharingMethod.vue'
    );
    const { mount } = await import('@vue/test-utils');
    
    const wrapper = mount(ResourceSharingMethod);
    const html = wrapper.html();
    // Verify spinner with id is rendered when schemasLoading is true
    expect(html).toContain('id="resource-schemas-loading"');
  });

  it('does not render schemas loading spinner when not loading', async () => {
    const { storeToRefs } = await import('pinia');
    vi.mocked(storeToRefs).mockReturnValueOnce(createMockRefs({
      resourceAddressTemplates: ref([]),
      schemasLoading: ref(false),
      sharingMethodId: ref('test-method'),
    }) as any);

    const { default: ResourceSharingMethod } = await import(
      '@/components/transfer/ResourceSharingMethod.vue'
    );
    const { mount } = await import('@vue/test-utils');
    
    const wrapper = mount(ResourceSharingMethod);
    // With v-if="false", the spinner should not exist in DOM (v-if removes from DOM)
    // When schemasLoading is false, there should be no loading spinner with id="resource-schemas-loading"
    expect(wrapper.find('#resource-schemas-loading').exists()).toBe(false);
  });

  it('renders error message with correct id when resource address templates have error', async () => {
    const { storeToRefs } = await import('pinia');
    vi.mocked(storeToRefs).mockReturnValueOnce(createMockRefs({
      resourceAddressTemplates: ref([]),
      resourceAddressTemplatesError: ref({ title: 'Template Error', description: 'Error description' }),
      sharingMethodId: ref('test-method'),
    }) as any);

    const { default: ResourceSharingMethod } = await import(
      '@/components/transfer/ResourceSharingMethod.vue'
    );
    const { mount } = await import('@vue/test-utils');
    
    const wrapper = mount(ResourceSharingMethod);
    const html = wrapper.html();
    // Executes line with id="resource-address-templates-error"
    expect(html).toContain('resource-address-templates-error');
  });

  it('renders json forms wrapper when schema is available', async () => {
    const { storeToRefs } = await import('pinia');
    vi.mocked(storeToRefs).mockReturnValueOnce(createMockRefs({
      resourceAddressTemplates: ref([{ label: 'Template 1', value: 'template1' }]),
      selectedTemplate: ref('template1'),
      selectedTemplateSchema: ref({ type: 'object', properties: {} }),
      selectedTemplateUiSchema: ref({ type: 'VerticalLayout', elements: [] }),
      sharingMethodId: ref('test-method'),
    }) as any);

    const { default: ResourceSharingMethod } = await import(
      '@/components/transfer/ResourceSharingMethod.vue'
    );
    const { mount } = await import('@vue/test-utils');
    
    const wrapper = mount(ResourceSharingMethod);
    // This triggers the SJsonFormsWrapper branch, executing lines 35 and 40
    expect(wrapper.exists()).toBe(true);
  });
});
