import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import ResourceDescriptionDetailsOverlay from '@/components/ResourceDescriptionDetailsOverlay.vue';
import type { SearchAPISelfDescriptionDocument, PossibleUIError } from '@simpl/vue-components';
import type { ConvertedSchema } from '@/types/shapes';

// Hoist mocks to be available in vi.mock
const mocks = vi.hoisted(() => {
  const SOverlay = {
    template: '<div class="s-overlay"><slot /><slot name="footer" /></div>',
    props: ['modelValue', 'title'],
    emits: ['hide', 'update:modelValue'],
  };
  const SStatusMessage = {
    template: '<div class="s-status-message"><slot /></div>',
    props: ['variant', 'title'],
  };
  const SLoadingSpinner = {
    template: '<div class="s-loading-spinner"></div>',
  };
  const SButton = {
    template: '<button class="s-button"><slot /></button>',
    props: ['severity', 'label'],
  };
  const ResourceDescriptionDetails = {
    template: '<div class="resource-description-details"></div>',
    props: ['detailedInput', 'resourceDescriptionError'],
  };
  const getResourceDescriptionSummaryFromDocument = vi.fn();
  const getResourceDescriptionSchemaName = vi.fn();
  const getResourceDescriptionSchemaVersion = vi.fn();
  const getResourceDescriptionSharingMethod = vi.fn();
  const buildDetailedLabeledResourceDescriptionFromSchemaAndData = vi.fn();
  const SModal = {
    template: '<div class="s-modal"><slot name="header" /><slot /><slot name="footer" /></div>',
    props: ['modelValue', 'title'],
    emits: ['update:modelValue'],
  };
  const mockGetResourceDescriptionById = vi.fn();
  const mockRevokeResourceDescriptionById = vi.fn();
  const mockUseConvertedSchemas = vi.fn();
  const mockUseVersionedConvertedSchemas = vi.fn();
  const mockUseSchemasStore = vi.fn();
  const mockFetchLocalEndpoint = vi.fn();
  const mockSetSuccessDetails = vi.fn();

  return {
    SOverlay,
    SStatusMessage,
    SLoadingSpinner,
    SButton,
    SModal,
    ResourceDescriptionDetails,
    getResourceDescriptionSummaryFromDocument,
    getResourceDescriptionSchemaName,
    getResourceDescriptionSchemaVersion,
    getResourceDescriptionSharingMethod,
    buildDetailedLabeledResourceDescriptionFromSchemaAndData,
    mockGetResourceDescriptionById,
    mockRevokeResourceDescriptionById,
    mockUseConvertedSchemas,
    mockUseVersionedConvertedSchemas,
    mockUseSchemasStore,
    mockFetchLocalEndpoint,
    mockSetSuccessDetails,
  };
});

vi.mock('@simpl/vue-components', () => ({
  SOverlay: mocks.SOverlay,
  SStatusMessage: mocks.SStatusMessage,
  SLoadingSpinner: mocks.SLoadingSpinner,
  SButton: mocks.SButton,
  SModal: mocks.SModal,
  ResourceDescriptionRendererHost: { template: '<div></div>' },
  getResourceDescriptionSummaryFromDocument: mocks.getResourceDescriptionSummaryFromDocument,
  getResourceDescriptionSchemaName: mocks.getResourceDescriptionSchemaName,
  getResourceDescriptionSchemaVersion: mocks.getResourceDescriptionSchemaVersion,
  getResourceDescriptionSharingMethod: mocks.getResourceDescriptionSharingMethod,
  buildDetailedLabeledResourceDescriptionFromSchemaAndData:
    mocks.buildDetailedLabeledResourceDescriptionFromSchemaAndData,
}));

vi.mock('@/components/ResourceDescriptionDetails.vue', () => ({
  default: mocks.ResourceDescriptionDetails,
}));

vi.mock('@/services/composables/useResourceDescriptions', () => ({
  useResourceDescriptions: () => ({
    getResourceDescriptionById: mocks.mockGetResourceDescriptionById,
    revokeResourceDescriptionById: mocks.mockRevokeResourceDescriptionById,
  }),
}));

vi.mock('@/store/temporarySuccessMessage', () => ({
  useTemporarySuccessMessageStore: () => ({
    setSuccessDetails: mocks.mockSetSuccessDetails,
  }),
}));

vi.mock('@/services/composables/useConvertedSchemas', () => ({
  useConvertedSchemas: mocks.mockUseConvertedSchemas,
  useVersionedConvertedSchemas: mocks.mockUseVersionedConvertedSchemas,
}));

vi.mock('@/store/schemas', () => ({
  useSchemasStore: mocks.mockUseSchemasStore,
}));

vi.mock('@/util/services', () => ({
  fetchLocalEndpoint: mocks.mockFetchLocalEndpoint,
}));

describe('ResourceDescriptionDetailsOverlay.vue', () => {
  let wrapper: any;
  const originalLocation = window.location;
  const mockLocationAssign = vi.fn();

  const mockResourceDescriptionData: SearchAPISelfDescriptionDocument = {
    '@context': 'http://example.com',
    '@id': 'resource-123',
    '@type': 'gax-trust-framework:ServiceOffering',
    credentialSubject: {
      'gax-trust-framework:name': 'Test Resource',
      'gax-trust-framework:description': 'Test Description',
    },
  } as any;

  const mockConvertedSchema: ConvertedSchema = {
    root: {
      ServiceOffering: {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      } as any,
    },
    prefixes: {},
  };

  const mockDetailedInput = {
    label: 'Test Resource',
    value: 'Test Description',
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock window.location
    delete (window as any).location;
    window.location = {
      ...originalLocation,
      assign: mockLocationAssign,
    } as any;

    mocks.getResourceDescriptionSummaryFromDocument.mockReturnValue({
      title: 'Test Resource',
    });
    mocks.getResourceDescriptionSchemaName.mockReturnValue('service-offeringShape');
    mocks.getResourceDescriptionSchemaVersion.mockReturnValue(null);
    mocks.getResourceDescriptionSharingMethod.mockReturnValue(null);
    mocks.buildDetailedLabeledResourceDescriptionFromSchemaAndData.mockReturnValue(
      mockDetailedInput
    );
    mocks.mockUseSchemasStore.mockReturnValue({});
    mocks.mockFetchLocalEndpoint.mockResolvedValue({
      data: { value: null },
      error: { value: null },
    });
  });

  afterEach(() => {
    (window as any).location = originalLocation;
    wrapper?.unmount();
  });

  describe('when resourceDescriptionId is not provided', () => {
    it('should set resourceDescriptionError', async () => {
      mocks.mockGetResourceDescriptionById.mockResolvedValue({
        data: { value: null },
        error: { value: null },
      });

      wrapper = mount(ResourceDescriptionDetailsOverlay, {
        props: {},
        global: {
          stubs: {
            SOverlay: mocks.SOverlay,
            SStatusMessage: mocks.SStatusMessage,
            SLoadingSpinner: mocks.SLoadingSpinner,
            ResourceDescriptionDetails: mocks.ResourceDescriptionDetails,
          },
        },
      });

      await flushPromises();

      expect(wrapper.vm.resourceDescriptionError).toEqual({
        title: 'Resource description not found',
        description: 'No resource description ID was provided.',
      });
    });

    it('should not call getResourceDescriptionById', async () => {
      wrapper = mount(ResourceDescriptionDetailsOverlay, {
        props: {},
        global: {
          stubs: {
            SOverlay: mocks.SOverlay,
            SStatusMessage: mocks.SStatusMessage,
            SLoadingSpinner: mocks.SLoadingSpinner,
            ResourceDescriptionDetails: mocks.ResourceDescriptionDetails,
          },
        },
      });

      await flushPromises();

      expect(mocks.mockGetResourceDescriptionById).not.toHaveBeenCalled();
    });
  });

  describe('when resourceDescriptionId is provided', () => {
    it('should fetch resource description successfully', async () => {
      mocks.mockGetResourceDescriptionById.mockResolvedValue({
        data: { value: mockResourceDescriptionData },
        error: { value: null },
      });
      mocks.mockUseConvertedSchemas.mockResolvedValue({
        data: { value: mockConvertedSchema },
        error: { value: null },
      });

      wrapper = mount(ResourceDescriptionDetailsOverlay, {
        props: {
          resourceDescriptionId: 'resource-123',
        },
        global: {
          stubs: {
            SOverlay: mocks.SOverlay,
            SStatusMessage: mocks.SStatusMessage,
            SLoadingSpinner: mocks.SLoadingSpinner,
            ResourceDescriptionDetails: mocks.ResourceDescriptionDetails,
          },
        },
      });

      await flushPromises();

      expect(mocks.mockGetResourceDescriptionById).toHaveBeenCalledWith('resource-123');
      expect(wrapper.vm.resourceDescriptionData).toEqual(mockResourceDescriptionData);
      expect(wrapper.vm.detailedInput).toEqual(mockDetailedInput);
      expect(mocks.buildDetailedLabeledResourceDescriptionFromSchemaAndData).toHaveBeenCalledWith(
        mockConvertedSchema.root.ServiceOffering,
        mockResourceDescriptionData.credentialSubject
      );
    });

    it('should handle fetch error', async () => {
      const mockError: PossibleUIError = {
        title: 'Error fetching resource',
        description: 'Failed to load resource description',
      };

      mocks.mockGetResourceDescriptionById.mockResolvedValue({
        data: { value: null },
        error: { value: mockError },
      });

      wrapper = mount(ResourceDescriptionDetailsOverlay, {
        props: {
          resourceDescriptionId: 'resource-123',
        },
        global: {
          stubs: {
            SOverlay: mocks.SOverlay,
            SStatusMessage: mocks.SStatusMessage,
            SLoadingSpinner: mocks.SLoadingSpinner,
            ResourceDescriptionDetails: mocks.ResourceDescriptionDetails,
          },
        },
      });

      await flushPromises();

      expect(wrapper.vm.resourceDescriptionError).toEqual(mockError);
    });

    it('should fetch schema when schema name is available', async () => {
      mocks.mockGetResourceDescriptionById.mockResolvedValue({
        data: { value: mockResourceDescriptionData },
        error: { value: null },
      });
      mocks.mockUseConvertedSchemas.mockResolvedValue({
        data: { value: mockConvertedSchema },
        error: { value: null },
      });

      wrapper = mount(ResourceDescriptionDetailsOverlay, {
        props: {
          resourceDescriptionId: 'resource-123',
        },
        global: {
          stubs: {
            SOverlay: mocks.SOverlay,
            SStatusMessage: mocks.SStatusMessage,
            SLoadingSpinner: mocks.SLoadingSpinner,
            ResourceDescriptionDetails: mocks.ResourceDescriptionDetails,
          },
        },
      });

      await flushPromises();

      expect(mocks.getResourceDescriptionSchemaName).toHaveBeenCalledWith(
        mockResourceDescriptionData
      );
      expect(mocks.mockUseConvertedSchemas).toHaveBeenCalledWith('service-offeringShape');
      expect(wrapper.vm.resourceDescriptionSchema).toEqual(mockConvertedSchema);
    });

    it('should handle schema fetch error', async () => {
      const mockSchemaError: PossibleUIError = {
        title: 'Schema Error',
        description: 'Failed to load schema',
      };

      mocks.mockGetResourceDescriptionById.mockResolvedValue({
        data: { value: mockResourceDescriptionData },
        error: { value: null },
      });
      mocks.mockUseConvertedSchemas.mockResolvedValue({
        data: { value: null },
        error: { value: mockSchemaError },
      });

      wrapper = mount(ResourceDescriptionDetailsOverlay, {
        props: {
          resourceDescriptionId: 'resource-123',
        },
        global: {
          stubs: {
            SOverlay: mocks.SOverlay,
            SStatusMessage: mocks.SStatusMessage,
            SLoadingSpinner: mocks.SLoadingSpinner,
            ResourceDescriptionDetails: mocks.ResourceDescriptionDetails,
          },
        },
      });

      await flushPromises();

      expect(wrapper.vm.resourceDescriptionSchemaError).toEqual(mockSchemaError);
    });

    it('should not fetch schema when schema name is not available', async () => {
      mocks.getResourceDescriptionSchemaName.mockReturnValue(null);
      mocks.mockGetResourceDescriptionById.mockResolvedValue({
        data: { value: mockResourceDescriptionData },
        error: { value: null },
      });

      wrapper = mount(ResourceDescriptionDetailsOverlay, {
        props: {
          resourceDescriptionId: 'resource-123',
        },
        global: {
          stubs: {
            SOverlay: mocks.SOverlay,
            SStatusMessage: mocks.SStatusMessage,
            SLoadingSpinner: mocks.SLoadingSpinner,
            ResourceDescriptionDetails: mocks.ResourceDescriptionDetails,
          },
        },
      });

      await flushPromises();

      expect(mocks.mockUseConvertedSchemas).not.toHaveBeenCalled();
      expect(wrapper.vm.resourceDescriptionSchema).toBeNull();
    });
  });

  describe('overlay title', () => {
    it('should use resource title when available', async () => {
      mocks.mockGetResourceDescriptionById.mockResolvedValue({
        data: { value: mockResourceDescriptionData },
        error: { value: null },
      });
      mocks.mockUseConvertedSchemas.mockResolvedValue({
        data: { value: mockConvertedSchema },
        error: { value: null },
      });

      wrapper = mount(ResourceDescriptionDetailsOverlay, {
        props: {
          resourceDescriptionId: 'resource-123',
        },
        global: {
          stubs: {
            SOverlay: mocks.SOverlay,
            SStatusMessage: mocks.SStatusMessage,
            SLoadingSpinner: mocks.SLoadingSpinner,
            ResourceDescriptionDetails: mocks.ResourceDescriptionDetails,
          },
        },
      });

      await flushPromises();

      expect(wrapper.vm.overlayTitle).toBe('Test Resource');
    });

    it('should use default title when resource title is not available', async () => {
      mocks.getResourceDescriptionSummaryFromDocument.mockReturnValue(null);
      mocks.mockGetResourceDescriptionById.mockResolvedValue({
        data: { value: mockResourceDescriptionData },
        error: { value: null },
      });
      mocks.mockUseConvertedSchemas.mockResolvedValue({
        data: { value: mockConvertedSchema },
        error: { value: null },
      });

      wrapper = mount(ResourceDescriptionDetailsOverlay, {
        props: {
          resourceDescriptionId: 'resource-123',
        },
        global: {
          stubs: {
            SOverlay: mocks.SOverlay,
            SStatusMessage: mocks.SStatusMessage,
            ResourceDescriptionDetails: mocks.ResourceDescriptionDetails,
          },
        },
      });

      await flushPromises();

      expect(wrapper.vm.overlayTitle).toBe('Resource description details');
    });

    it('should use default title when no resource data', async () => {
      mocks.mockGetResourceDescriptionById.mockResolvedValue({
        data: { value: null },
        error: { value: { title: 'Error', description: 'Not found' } },
      });

      wrapper = mount(ResourceDescriptionDetailsOverlay, {
        props: {
          resourceDescriptionId: 'resource-123',
        },
        global: {
          stubs: {
            SOverlay: mocks.SOverlay,
            SStatusMessage: mocks.SStatusMessage,
            SLoadingSpinner: mocks.SLoadingSpinner,
            ResourceDescriptionDetails: mocks.ResourceDescriptionDetails,
          },
        },
      });

      await flushPromises();

      expect(wrapper.vm.overlayTitle).toBe('Resource description details');
    });
  });

  describe('overlay behavior', () => {
    it('should open overlay by default', async () => {
      mocks.mockGetResourceDescriptionById.mockResolvedValue({
        data: { value: mockResourceDescriptionData },
        error: { value: null },
      });
      mocks.mockUseConvertedSchemas.mockResolvedValue({
        data: { value: mockConvertedSchema },
        error: { value: null },
      });

      wrapper = mount(ResourceDescriptionDetailsOverlay, {
        props: {
          resourceDescriptionId: 'resource-123',
        },
        global: {
          stubs: {
            SOverlay: mocks.SOverlay,
            SStatusMessage: mocks.SStatusMessage,
            SLoadingSpinner: mocks.SLoadingSpinner,
            ResourceDescriptionDetails: mocks.ResourceDescriptionDetails,
          },
        },
      });

      await flushPromises();

      expect(wrapper.vm.isOpen).toBe(true);
    });

    it('should navigate to home when overlay is closed', async () => {
      mocks.mockGetResourceDescriptionById.mockResolvedValue({
        data: { value: mockResourceDescriptionData },
        error: { value: null },
      });
      mocks.mockUseConvertedSchemas.mockResolvedValue({
        data: { value: mockConvertedSchema },
        error: { value: null },
      });

      wrapper = mount(ResourceDescriptionDetailsOverlay, {
        props: {
          resourceDescriptionId: 'resource-123',
        },
        global: {
          stubs: {
            SOverlay: mocks.SOverlay,
            SStatusMessage: mocks.SStatusMessage,
            SLoadingSpinner: mocks.SLoadingSpinner,
            ResourceDescriptionDetails: mocks.ResourceDescriptionDetails,
          },
        },
      });

      await flushPromises();

      wrapper.vm.closeOverlay();

      expect(mockLocationAssign).toHaveBeenCalledWith('/');
    });
  });

  describe('component rendering', () => {
    it('should render schema error message when present', async () => {
      const mockSchemaError: PossibleUIError = {
        title: 'Schema Error',
        description: 'Failed to load schema',
      };

      mocks.mockGetResourceDescriptionById.mockResolvedValue({
        data: { value: mockResourceDescriptionData },
        error: { value: null },
      });
      mocks.mockUseConvertedSchemas.mockResolvedValue({
        data: { value: null },
        error: { value: mockSchemaError },
      });

      wrapper = mount(ResourceDescriptionDetailsOverlay, {
        props: {
          resourceDescriptionId: 'resource-123',
        },
        global: {
          stubs: {
            SOverlay: mocks.SOverlay,
            SStatusMessage: mocks.SStatusMessage,
            ResourceDescriptionDetails: mocks.ResourceDescriptionDetails,
          },
        },
      });

      await flushPromises();

      const statusMessage = wrapper.findComponent(mocks.SStatusMessage);
      expect(statusMessage.exists()).toBe(true);
      expect(statusMessage.props('title')).toBe('Schema Error');
      expect(statusMessage.props('variant')).toBe('error');
      expect(statusMessage.text()).toContain('Failed to load schema');
    });

    it('should not render schema error message when not present', async () => {
      mocks.mockGetResourceDescriptionById.mockResolvedValue({
        data: { value: mockResourceDescriptionData },
        error: { value: null },
      });
      mocks.mockUseConvertedSchemas.mockResolvedValue({
        data: { value: mockConvertedSchema },
        error: { value: null },
      });

      wrapper = mount(ResourceDescriptionDetailsOverlay, {
        props: {
          resourceDescriptionId: 'resource-123',
        },
        global: {
          stubs: {
            SOverlay: mocks.SOverlay,
            SStatusMessage: mocks.SStatusMessage,
            SLoadingSpinner: mocks.SLoadingSpinner,
            ResourceDescriptionDetails: mocks.ResourceDescriptionDetails,
          },
        },
      });

      await flushPromises();

      const statusMessage = wrapper.findComponent(mocks.SStatusMessage);
      expect(statusMessage.exists()).toBe(false);
    });

    it('should render ResourceDescriptionDetails component', async () => {
      mocks.mockGetResourceDescriptionById.mockResolvedValue({
        data: { value: mockResourceDescriptionData },
        error: { value: null },
      });
      mocks.mockUseConvertedSchemas.mockResolvedValue({
        data: { value: mockConvertedSchema },
        error: { value: null },
      });

      wrapper = mount(ResourceDescriptionDetailsOverlay, {
        props: {
          resourceDescriptionId: 'resource-123',
        },
        global: {
          stubs: {
            SOverlay: mocks.SOverlay,
            SStatusMessage: mocks.SStatusMessage,
            ResourceDescriptionDetails: mocks.ResourceDescriptionDetails,
          },
        },
      });

      await flushPromises();

      const detailsComponent = wrapper.findComponent(mocks.ResourceDescriptionDetails);
      expect(detailsComponent.exists()).toBe(true);
      expect(detailsComponent.props('detailedInput')).toEqual(mockDetailedInput);
    });

    it('should pass resourceDescriptionError to ResourceDescriptionDetails', async () => {
      const mockError: PossibleUIError = {
        title: 'Error',
        description: 'Failed to load',
      };

      mocks.mockGetResourceDescriptionById.mockResolvedValue({
        data: { value: null },
        error: { value: mockError },
      });

      wrapper = mount(ResourceDescriptionDetailsOverlay, {
        props: {
          resourceDescriptionId: 'resource-123',
        },
        global: {
          stubs: {
            SOverlay: mocks.SOverlay,
            SStatusMessage: mocks.SStatusMessage,
            SLoadingSpinner: mocks.SLoadingSpinner,
            ResourceDescriptionDetails: mocks.ResourceDescriptionDetails,
          },
        },
      });

      await flushPromises();

      const detailsComponent = wrapper.findComponent(mocks.ResourceDescriptionDetails);
      expect(detailsComponent.props('resourceDescriptionError')).toEqual(mockError);
    });
  });

  describe('revoke functionality', () => {
    const defaultGlobal = () => ({
      stubs: {
        SOverlay: mocks.SOverlay,
        SStatusMessage: mocks.SStatusMessage,
        SLoadingSpinner: mocks.SLoadingSpinner,
        SModal: mocks.SModal,
        SButton: mocks.SButton,
        ResourceDescriptionDetails: mocks.ResourceDescriptionDetails,
      },
    });

    beforeEach(() => {
      mocks.mockGetResourceDescriptionById.mockResolvedValue({
        data: { value: mockResourceDescriptionData },
        error: { value: null },
      });
      mocks.mockUseConvertedSchemas.mockResolvedValue({
        data: { value: mockConvertedSchema },
        error: { value: null },
      });
    });

    it('should show revoke modal and clear revokeError when handleRevokeVersion is called', async () => {
      wrapper = mount(ResourceDescriptionDetailsOverlay, {
        props: { resourceDescriptionId: 'resource-123' },
        global: defaultGlobal(),
      });
      await flushPromises();

      expect(wrapper.vm.showRevokeModal).toBe(false);
      wrapper.vm.handleRevokeVersion();
      expect(wrapper.vm.showRevokeModal).toBe(true);
      expect(wrapper.vm.revokeError).toBeNull();
    });

    it('should call revokeResourceDescriptionById, setSuccessDetails with title and revoked action, and redirect on success', async () => {
      mocks.mockRevokeResourceDescriptionById.mockResolvedValue({
        error: { value: null },
      });

      wrapper = mount(ResourceDescriptionDetailsOverlay, {
        props: { resourceDescriptionId: 'resource-123' },
        global: defaultGlobal(),
      });
      await flushPromises();

      await wrapper.vm.confirmRevoke();

      expect(mocks.mockRevokeResourceDescriptionById).toHaveBeenCalledWith('resource-123');
      expect(mocks.mockSetSuccessDetails).toHaveBeenCalledWith(
        'resource-123',
        'Test Resource',
        'revoked'
      );
      expect(mockLocationAssign).toHaveBeenCalledWith('/');
    });

    it('should set revokeError and not redirect when revokeResourceDescriptionById fails', async () => {
      const mockRevokeError = { title: 'Revoke Error', description: 'Failed to revoke' };
      mocks.mockRevokeResourceDescriptionById.mockResolvedValue({
        error: { value: mockRevokeError },
      });

      wrapper = mount(ResourceDescriptionDetailsOverlay, {
        props: { resourceDescriptionId: 'resource-123' },
        global: defaultGlobal(),
      });
      await flushPromises();

      await wrapper.vm.confirmRevoke();

      expect(wrapper.vm.revokeError).toEqual(mockRevokeError);
      expect(mocks.mockSetSuccessDetails).not.toHaveBeenCalled();
      expect(mockLocationAssign).not.toHaveBeenCalled();
    });

    it('should return early from confirmRevoke when no resourceDescriptionId', async () => {
      wrapper = mount(ResourceDescriptionDetailsOverlay, {
        props: {},
        global: defaultGlobal(),
      });
      await flushPromises();

      await wrapper.vm.confirmRevoke();

      expect(mocks.mockRevokeResourceDescriptionById).not.toHaveBeenCalled();
      expect(mocks.mockSetSuccessDetails).not.toHaveBeenCalled();
    });
  });

  describe('detailedInput', () => {
    it('should build detailed input from the schema and resource description data', async () => {
      mocks.mockGetResourceDescriptionById.mockResolvedValue({
        data: { value: mockResourceDescriptionData },
        error: { value: null },
      });
      mocks.mockUseConvertedSchemas.mockResolvedValue({
        data: { value: mockConvertedSchema },
        error: { value: null },
      });

      wrapper = mount(ResourceDescriptionDetailsOverlay, {
        props: {
          resourceDescriptionId: 'resource-123',
        },
        global: {
          stubs: {
            SOverlay: mocks.SOverlay,
            SStatusMessage: mocks.SStatusMessage,
            SLoadingSpinner: mocks.SLoadingSpinner,
            ResourceDescriptionDetails: mocks.ResourceDescriptionDetails,
          },
        },
      });

      await flushPromises();

      expect(mocks.buildDetailedLabeledResourceDescriptionFromSchemaAndData).toHaveBeenCalledWith(
        mockConvertedSchema.root.ServiceOffering,
        mockResourceDescriptionData.credentialSubject
      );
    });

    it('should inject resource address data into credential subject when available', async () => {
      const rdDataWithAsset = {
        ...mockResourceDescriptionData,
        credentialSubject: {
          ...mockResourceDescriptionData.credentialSubject,
          'simpl:edcRegistration': { 'simpl:assetId': 'asset-456' },
        },
      };

      mocks.mockGetResourceDescriptionById.mockResolvedValue({
        data: { value: rdDataWithAsset },
        error: { value: null },
      });
      mocks.mockUseConvertedSchemas.mockResolvedValue({
        data: { value: mockConvertedSchema },
        error: { value: null },
      });
      mocks.mockFetchLocalEndpoint.mockResolvedValue({
        data: {
          value: {
            templateId: 'tpl-1',
            value: '{"type":"MinioS3","endpoint":"http://example.com"}',
          },
        },
        error: { value: null },
      });

      wrapper = mount(ResourceDescriptionDetailsOverlay, {
        props: {
          resourceDescriptionId: 'resource-123',
        },
        global: {
          stubs: {
            SOverlay: mocks.SOverlay,
            SStatusMessage: mocks.SStatusMessage,
            SLoadingSpinner: mocks.SLoadingSpinner,
            ResourceDescriptionDetails: mocks.ResourceDescriptionDetails,
          },
        },
      });

      await flushPromises();

      expect(mocks.mockFetchLocalEndpoint).toHaveBeenCalledWith(
        '/api/resourceAddresses/assets/asset-456',
        expect.objectContaining({ method: 'GET' })
      );
      expect(mocks.buildDetailedLabeledResourceDescriptionFromSchemaAndData).toHaveBeenCalledWith(
        mockConvertedSchema.root.ServiceOffering,
        expect.objectContaining({
          'simpl:assetProperties': {
            'simpl:providerDataAddress': '{"type":"MinioS3","endpoint":"http://example.com"}',
          },
        })
      );
    });

    it('should not fetch resource address when no assetId is present', async () => {
      mocks.mockGetResourceDescriptionById.mockResolvedValue({
        data: { value: mockResourceDescriptionData },
        error: { value: null },
      });
      mocks.mockUseConvertedSchemas.mockResolvedValue({
        data: { value: mockConvertedSchema },
        error: { value: null },
      });

      wrapper = mount(ResourceDescriptionDetailsOverlay, {
        props: {
          resourceDescriptionId: 'resource-123',
        },
        global: {
          stubs: {
            SOverlay: mocks.SOverlay,
            SStatusMessage: mocks.SStatusMessage,
            SLoadingSpinner: mocks.SLoadingSpinner,
            ResourceDescriptionDetails: mocks.ResourceDescriptionDetails,
          },
        },
      });

      await flushPromises();

      expect(mocks.mockFetchLocalEndpoint).not.toHaveBeenCalled();
    });

    it('should handle resource address fetch error gracefully', async () => {
      const rdDataWithAsset = {
        ...mockResourceDescriptionData,
        credentialSubject: {
          ...mockResourceDescriptionData.credentialSubject,
          'simpl:edcRegistration': { 'simpl:assetId': 'asset-789' },
        },
      };

      mocks.mockGetResourceDescriptionById.mockResolvedValue({
        data: { value: rdDataWithAsset },
        error: { value: null },
      });
      mocks.mockUseConvertedSchemas.mockResolvedValue({
        data: { value: mockConvertedSchema },
        error: { value: null },
      });
      mocks.mockFetchLocalEndpoint.mockResolvedValue({
        data: { value: null },
        error: { value: { title: 'Not found', description: 'Asset not found' } },
      });

      wrapper = mount(ResourceDescriptionDetailsOverlay, {
        props: {
          resourceDescriptionId: 'resource-123',
        },
        global: {
          stubs: {
            SOverlay: mocks.SOverlay,
            SStatusMessage: mocks.SStatusMessage,
            SLoadingSpinner: mocks.SLoadingSpinner,
            ResourceDescriptionDetails: mocks.ResourceDescriptionDetails,
          },
        },
      });

      await flushPromises();

      // Should still render without the resource address data
      expect(mocks.buildDetailedLabeledResourceDescriptionFromSchemaAndData).toHaveBeenCalledWith(
        mockConvertedSchema.root.ServiceOffering,
        rdDataWithAsset.credentialSubject
      );
    });
  });

  describe('handleCreateNewVersion', () => {
    const mountWithLoadedData = async (rdData = mockResourceDescriptionData) => {
      mocks.mockGetResourceDescriptionById.mockResolvedValue({
        data: { value: rdData },
        error: { value: null },
      });
      mocks.mockUseConvertedSchemas.mockResolvedValue({
        data: { value: mockConvertedSchema },
        error: { value: null },
      });

      wrapper = mount(ResourceDescriptionDetailsOverlay, {
        props: { resourceDescriptionId: 'resource-123' },
        global: {
          stubs: {
            SOverlay: mocks.SOverlay,
            SStatusMessage: mocks.SStatusMessage,
            SLoadingSpinner: mocks.SLoadingSpinner,
            ResourceDescriptionDetails: mocks.ResourceDescriptionDetails,
          },
        },
      });

      await flushPromises();
    };

    it('should redirect to the create page when schemaId and resourceDescriptionData are set', async () => {
      await mountWithLoadedData();

      wrapper.vm.handleCreateNewVersion();

      expect(mockLocationAssign).toHaveBeenCalledWith(
        '/resourceDescriptions/service-offeringShape/new'
      );
    });

    it('should store the credentialSubject in sessionStorage', async () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      await mountWithLoadedData();

      wrapper.vm.handleCreateNewVersion();

      expect(setItemSpy).toHaveBeenCalledWith(
        'newVersionCredentialSubject',
        JSON.stringify(mockResourceDescriptionData.credentialSubject)
      );
    });

    it('should store sharingMethodId in sessionStorage when a sharing method is available', async () => {
      mocks.getResourceDescriptionSharingMethod.mockReturnValue('sharing-method-123');
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      await mountWithLoadedData();

      wrapper.vm.handleCreateNewVersion();

      expect(setItemSpy).toHaveBeenCalledWith('newVersionSharingMethodId', 'sharing-method-123');
    });

    it('should not store sharingMethodId when sharing method is null', async () => {
      mocks.getResourceDescriptionSharingMethod.mockReturnValue(null);
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      await mountWithLoadedData();

      wrapper.vm.handleCreateNewVersion();

      expect(setItemSpy).not.toHaveBeenCalledWith('newVersionSharingMethodId', expect.anything());
    });

    it('should store assetId in sessionStorage when edcRegistration has a simpl:assetId', async () => {
      const rdDataWithAsset = {
        ...mockResourceDescriptionData,
        credentialSubject: {
          ...mockResourceDescriptionData.credentialSubject,
          'simpl:edcRegistration': { 'simpl:assetId': 'edc-asset-999' },
        },
      };
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      await mountWithLoadedData(rdDataWithAsset as any);

      wrapper.vm.handleCreateNewVersion();

      expect(setItemSpy).toHaveBeenCalledWith('newVersionAssetId', 'edc-asset-999');
    });

    it('should not store assetId when no edcRegistration is present', async () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
      await mountWithLoadedData();

      wrapper.vm.handleCreateNewVersion();

      expect(setItemSpy).not.toHaveBeenCalledWith('newVersionAssetId', expect.anything());
    });

    it('should do nothing when schemaId is not available', async () => {
      mocks.getResourceDescriptionSchemaName.mockReturnValue(null);
      mocks.mockGetResourceDescriptionById.mockResolvedValue({
        data: { value: mockResourceDescriptionData },
        error: { value: null },
      });

      wrapper = mount(ResourceDescriptionDetailsOverlay, {
        props: { resourceDescriptionId: 'resource-123' },
        global: {
          stubs: {
            SOverlay: mocks.SOverlay,
            SStatusMessage: mocks.SStatusMessage,
            SLoadingSpinner: mocks.SLoadingSpinner,
            ResourceDescriptionDetails: mocks.ResourceDescriptionDetails,
          },
        },
      });
      await flushPromises();

      wrapper.vm.handleCreateNewVersion();

      expect(mockLocationAssign).not.toHaveBeenCalled();
    });
  });

  describe('hideActions prop', () => {
    it('should hide footer action buttons when hideActions is true', async () => {
      mocks.mockGetResourceDescriptionById.mockResolvedValue({
        data: { value: mockResourceDescriptionData },
        error: { value: null },
      });
      mocks.mockUseConvertedSchemas.mockResolvedValue({
        data: { value: mockConvertedSchema },
        error: { value: null },
      });

      wrapper = mount(ResourceDescriptionDetailsOverlay, {
        props: {
          resourceDescriptionId: 'resource-123',
          hideActions: true,
        },
        global: {
          stubs: {
            SOverlay: mocks.SOverlay,
            SStatusMessage: mocks.SStatusMessage,
            SLoadingSpinner: mocks.SLoadingSpinner,
            SButton: mocks.SButton,
            ResourceDescriptionDetails: mocks.ResourceDescriptionDetails,
          },
        },
      });

      await flushPromises();

      expect(wrapper.find('[id="revoke-resource-description-button"]').exists()).toBe(false);
      expect(wrapper.find('[id="create-new-version-button"]').exists()).toBe(false);
    });
  });

  describe('returnUrl prop', () => {
    it('should navigate to returnUrl when overlay is closed with returnUrl set', async () => {
      mocks.mockGetResourceDescriptionById.mockResolvedValue({
        data: { value: mockResourceDescriptionData },
        error: { value: null },
      });
      mocks.mockUseConvertedSchemas.mockResolvedValue({
        data: { value: mockConvertedSchema },
        error: { value: null },
      });

      wrapper = mount(ResourceDescriptionDetailsOverlay, {
        props: {
          resourceDescriptionId: 'resource-123',
          returnUrl: '/resourceDescriptions/parent-id/versions',
        },
        global: {
          stubs: {
            SOverlay: mocks.SOverlay,
            SStatusMessage: mocks.SStatusMessage,
            SLoadingSpinner: mocks.SLoadingSpinner,
            ResourceDescriptionDetails: mocks.ResourceDescriptionDetails,
          },
        },
      });

      await flushPromises();

      wrapper.vm.closeOverlay();

      expect(mockLocationAssign).toHaveBeenCalledWith('/resourceDescriptions/parent-id/versions');
    });

    it('should navigate to / when closeOverlay is called without returnUrl', async () => {
      mocks.mockGetResourceDescriptionById.mockResolvedValue({
        data: { value: mockResourceDescriptionData },
        error: { value: null },
      });

      wrapper = mount(ResourceDescriptionDetailsOverlay, {
        props: { resourceDescriptionId: 'resource-123' },
        global: {
          stubs: {
            SOverlay: mocks.SOverlay,
            SStatusMessage: mocks.SStatusMessage,
            SLoadingSpinner: mocks.SLoadingSpinner,
            ResourceDescriptionDetails: mocks.ResourceDescriptionDetails,
          },
        },
      });

      await flushPromises();

      wrapper.vm.closeOverlay();

      expect(mockLocationAssign).toHaveBeenCalledWith('/');
    });
  });

  describe('versioned schema fetching', () => {
    it('should use useVersionedConvertedSchemas when a schema version is resolved', async () => {
      mocks.getResourceDescriptionSchemaVersion.mockReturnValue('1.0.0');
      mocks.mockGetResourceDescriptionById.mockResolvedValue({
        data: { value: mockResourceDescriptionData },
        error: { value: null },
      });
      mocks.mockUseVersionedConvertedSchemas.mockResolvedValue({
        data: { value: mockConvertedSchema },
        error: { value: null },
      });

      wrapper = mount(ResourceDescriptionDetailsOverlay, {
        props: { resourceDescriptionId: 'resource-123' },
        global: {
          stubs: {
            SOverlay: mocks.SOverlay,
            SStatusMessage: mocks.SStatusMessage,
            SLoadingSpinner: mocks.SLoadingSpinner,
            ResourceDescriptionDetails: mocks.ResourceDescriptionDetails,
          },
        },
      });

      await flushPromises();

      expect(mocks.mockUseVersionedConvertedSchemas).toHaveBeenCalledWith(
        'service-offeringShape',
        '1.0.0'
      );
      expect(mocks.mockUseConvertedSchemas).not.toHaveBeenCalled();
      expect(wrapper.vm.resourceDescriptionSchema).toEqual(mockConvertedSchema);
    });

    it('should fall back to useConvertedSchemas when no schema version is resolved', async () => {
      mocks.getResourceDescriptionSchemaVersion.mockReturnValue(null);
      mocks.mockGetResourceDescriptionById.mockResolvedValue({
        data: { value: mockResourceDescriptionData },
        error: { value: null },
      });
      mocks.mockUseConvertedSchemas.mockResolvedValue({
        data: { value: mockConvertedSchema },
        error: { value: null },
      });

      wrapper = mount(ResourceDescriptionDetailsOverlay, {
        props: { resourceDescriptionId: 'resource-123' },
        global: {
          stubs: {
            SOverlay: mocks.SOverlay,
            SStatusMessage: mocks.SStatusMessage,
            SLoadingSpinner: mocks.SLoadingSpinner,
            ResourceDescriptionDetails: mocks.ResourceDescriptionDetails,
          },
        },
      });

      await flushPromises();

      expect(mocks.mockUseConvertedSchemas).toHaveBeenCalledWith('service-offeringShape');
      expect(mocks.mockUseVersionedConvertedSchemas).not.toHaveBeenCalled();
    });
  });
});
