import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref, type Component } from 'vue';

const mockCredentialSubjectToFormData = vi.fn((cs) => ({ ...cs, converted: true }));
const mockConvertServicePolicyOdrlToSimpleFormat = vi.fn((data) => ({
  ...data,
  policyConverted: true,
}));

vi.mock('@/util/credentialSubjectToFormData', () => ({
  credentialSubjectToFormData: mockCredentialSubjectToFormData,
}));
vi.mock('@/util/convertOdrlToSimplePolicy', () => ({
  convertServicePolicyOdrlToSimpleFormat: mockConvertServicePolicyOdrlToSimpleFormat,
}));

type SetupResult = {
  wrapper: ReturnType<typeof mount>;
  storeMocks: {
    setSelectedShapeName: ReturnType<typeof vi.fn>;
    setInitialFormData: ReturnType<typeof vi.fn>;
    setParentIdentifier: ReturnType<typeof vi.fn>;
    setNewSchemaVersion: ReturnType<typeof vi.fn>;
    submitForm: ReturnType<typeof vi.fn>;
    closeOverlay: ReturnType<typeof vi.fn>;
    onFormChange: ReturnType<typeof vi.fn>;
    onMetadataChange: ReturnType<typeof vi.fn>;
    currentFormSchema: ReturnType<typeof ref>;
    config: ReturnType<typeof ref>;
    formData: ReturnType<typeof ref>;
    statusMessage: ReturnType<typeof ref>;
    overlayTitle: ReturnType<typeof ref>;
  };
};

const mountComponent = async (schemaId = 'service-offeringShape'): Promise<SetupResult> => {
  vi.resetModules();

  const storeMocks = {
    setSelectedShapeName: vi.fn(),
    setInitialFormData: vi.fn(),
    setParentIdentifier: vi.fn(),
    setNewSchemaVersion: vi.fn(),
    submitForm: vi.fn(),
    closeOverlay: vi.fn(),
    onFormChange: vi.fn(),
    onMetadataChange: vi.fn(),
    currentFormSchema: ref({ type: 'object', properties: {} }),
    config: ref({ apiBaseUrl: '/api' }),
    formData: ref({ name: 'Initial name' }),
    statusMessage: ref({ title: 'Saved', description: 'Done', severity: 'success' }),
    overlayTitle: ref('Create a resource description'),
  };

  const ResourceDescriptionCreationWizard = {
    name: 'ResourceDescriptionCreationWizard',
    template: '<div class="resource-description-creation-wizard"></div>',
    props: ['modelValue', 'data', 'schema', 'config', 'title', 'statusDetails'],
    emits: [
      'update:modelValue',
      'update:data',
      'hide',
      'cancel',
      'sign-and-submit',
      'change',
      'metadata-change',
    ],
  };

  vi.doMock('@simpl/vue-components', () => ({
    ResourceDescriptionCreationWizard,
  }));

  vi.doMock('pinia', () => ({
    storeToRefs: (store: any) => ({
      currentFormSchema: store.currentFormSchema,
      config: store.config,
      formData: store.formData,
      statusMessage: store.statusMessage,
      overlayTitle: store.overlayTitle,
    }),
  }));

  vi.doMock('@/store/resourceDescriptionCreation', () => ({
    useResourceDescriptionCreationStore: () => ({
      setSelectedShapeName: storeMocks.setSelectedShapeName,
      setInitialFormData: storeMocks.setInitialFormData,
      setParentIdentifier: storeMocks.setParentIdentifier,
      setNewSchemaVersion: storeMocks.setNewSchemaVersion,
      setInitialSharingMethodId: vi.fn(),
      setInitialAssetId: vi.fn(),
      submitForm: storeMocks.submitForm,
      closeOverlay: storeMocks.closeOverlay,
      onFormChange: storeMocks.onFormChange,
      onMetadataChange: storeMocks.onMetadataChange,
      currentFormSchema: storeMocks.currentFormSchema,
      config: storeMocks.config,
      formData: storeMocks.formData,
      statusMessage: storeMocks.statusMessage,
      overlayTitle: storeMocks.overlayTitle,
    }),
  }));

  const { default: ResourceDescriptionWizardWrapper } = (await import(
    '@/components/ResourceDescriptionWizardWrapper.vue'
  )) as { default: Component };

  const wrapper = mount(ResourceDescriptionWizardWrapper, {
    props: {
      schemaId,
    },
  });

  return { wrapper, storeMocks };
};

describe('ResourceDescriptionWizardWrapper.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes store refs and open state to the wizard', async () => {
    const { wrapper, storeMocks } = await mountComponent();

    const wizard = wrapper.findComponent({ name: 'ResourceDescriptionCreationWizard' });

    expect(wizard.exists()).toBe(true);
    expect(wizard.props('modelValue')).toBe(true);
    expect(wizard.props('data')).toEqual(storeMocks.formData.value);
    expect(wizard.props('schema')).toEqual(storeMocks.currentFormSchema.value);
    expect(wizard.props('config')).toEqual(storeMocks.config.value);
    expect(wizard.props('title')).toBe(storeMocks.overlayTitle.value);
    expect(wizard.props('statusDetails')).toEqual(storeMocks.statusMessage.value);
  });

  it('sets the selected shape name on mount', async () => {
    const { storeMocks } = await mountComponent('service-offeringShape');

    expect(storeMocks.setSelectedShapeName).toHaveBeenCalledWith('service-offeringShape');
  });

  it('forwards wizard events to the store actions', async () => {
    const { wrapper, storeMocks } = await mountComponent();

    const wizard = wrapper.findComponent({ name: 'ResourceDescriptionCreationWizard' });
    const formChangeEvent = { errors: [{ message: 'Invalid field' }] };
    const metadata = { templateId: 'template-123' };

    await wizard.vm.$emit('hide');
    await wizard.vm.$emit('cancel');
    await wizard.vm.$emit('sign-and-submit');
    await wizard.vm.$emit('change', formChangeEvent);
    await wizard.vm.$emit('metadata-change', metadata);

    expect(storeMocks.closeOverlay).toHaveBeenCalledTimes(2);
    expect(storeMocks.submitForm).toHaveBeenCalledTimes(1);
    expect(storeMocks.onFormChange).toHaveBeenCalledWith(formChangeEvent);
    expect(storeMocks.onMetadataChange).toHaveBeenCalledWith(metadata);
  });

  it('reads newVersionCredentialSubject from sessionStorage and calls setInitialFormData', async () => {
    const credentialSubject = { 'simpl:name': 'Test' };
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify(credentialSubject));
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {});

    const { storeMocks } = await mountComponent();

    expect(storeMocks.setInitialFormData).toHaveBeenCalledWith(
      expect.objectContaining({ policyConverted: true })
    );
  });

  it('calls setInitialFormData(null) when sessionStorage value is invalid JSON', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('not-valid-json{{{');
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {});

    const { storeMocks } = await mountComponent();

    expect(storeMocks.setInitialFormData).toHaveBeenCalledWith(null);
  });

  it('calls setParentIdentifier and setNewSchemaVersion with plain string values', async () => {
    const credentialSubject = {
      'simpl:generalServiceProperties': {
        'dcterms:identifier': 'web:did:parent-rd-id',
        'schema:version': '1',
      },
    };
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify(credentialSubject));

    const { storeMocks } = await mountComponent();

    expect(storeMocks.setParentIdentifier).toHaveBeenCalledWith('web:did:parent-rd-id');
    expect(storeMocks.setNewSchemaVersion).toHaveBeenCalledWith('1');
  });

  it('unwraps JSON-LD @value form of dcterms:identifier and schema:version', async () => {
    const credentialSubject = {
      'simpl:generalServiceProperties': {
        'dcterms:identifier': { '@value': 'web:did:parent-rd-id' },
        'schema:version': { '@value': '1' },
      },
    };
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify(credentialSubject));

    const { storeMocks } = await mountComponent();

    expect(storeMocks.setParentIdentifier).toHaveBeenCalledWith('web:did:parent-rd-id');
    expect(storeMocks.setNewSchemaVersion).toHaveBeenCalledWith('1');
  });
});
