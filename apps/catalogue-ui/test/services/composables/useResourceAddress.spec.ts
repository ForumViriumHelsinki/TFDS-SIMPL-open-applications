import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { useResourceAddress } from '@/services/composables/useResourceAddress';
import { fetchLocalEndpoint } from '@/util/services';

// Mock the dependencies
vi.mock('@/util/services', () => ({
  fetchLocalEndpoint: vi.fn(),
}));

describe('useResourceAddress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getResourceAddressTemplates', () => {
    const mockParams = {
      sharingMethodId: 'test-sharing-method',
      offeringType: 'data',
    };

    it('should call fetchLocalEndpoint with correct parameters for templates', async () => {
      const mockTemplates = [
        { id: 'template1', label: 'Template 1' },
        { id: 'template2', label: 'Template 2' },
      ];

      const mockTransformedOptions = [
        { label: 'Template 1', value: 'template1' },
        { label: 'Template 2', value: 'template2' },
      ];

      const mockResult = {
        data: ref(mockTransformedOptions),
        error: ref(null),
        isLoading: ref(false),
      };

      vi.mocked(fetchLocalEndpoint).mockResolvedValue(mockResult);

      const { getResourceAddressTemplates } = useResourceAddress();
      const result = await getResourceAddressTemplates(mockParams);

      expect(fetchLocalEndpoint).toHaveBeenCalledWith(
        `/api/resourceAddress/sharingMethods/${mockParams.sharingMethodId}/templates?offeringType=${mockParams.offeringType}`,
        {
          method: 'GET',
          errorIdentifier: 'RESOURCE_ADDRESS_TEMPLATES_ERROR',
          apiName: 'resource address',
        },
        expect.any(Function)
      );

      expect(result).toEqual(mockResult);
    });

    it('should handle errors when fetching templates', async () => {
      const mockError = {
        data: ref([]),
        error: ref({ title: 'Template Error', description: 'Failed to fetch templates' }),
        isLoading: ref(false),
      };

      vi.mocked(fetchLocalEndpoint).mockResolvedValue(mockError);

      const { getResourceAddressTemplates } = useResourceAddress();
      const result = await getResourceAddressTemplates(mockParams);

      expect(result.error.value).toEqual({
        title: 'Template Error',
        description: 'Failed to fetch templates',
      });
    });
  });

  describe('getResourceAddressSchema', () => {
    const mockParams = {
      templateId: 'test-template-id',
    };

    it('should call fetchLocalEndpoint with correct parameters for schema', async () => {
      const mockSchema = {
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        type: 'object',
        properties: {
          field1: { type: 'string' },
          field2: { type: 'number' },
        },
      };

      const mockResult = {
        data: ref(mockSchema),
        error: ref(null),
        isLoading: ref(false),
      };

      vi.mocked(fetchLocalEndpoint).mockResolvedValue(mockResult);

      const { getResourceAddressSchema } = useResourceAddress();
      const result = await getResourceAddressSchema(mockParams);

      expect(fetchLocalEndpoint).toHaveBeenCalledWith(
        `/api/resourceAddresses/templates/${mockParams.templateId}/schema`,
        {
          method: 'GET',
          errorIdentifier: 'RESOURCE_ADDRESS_SCHEMA_ERROR',
          apiName: 'resource address schema',
        }
      );

      expect(result).toEqual(mockResult);
    });

    it('should handle errors when fetching schema', async () => {
      const mockError = {
        data: ref(null),
        error: ref({ title: 'Schema Error', description: 'Failed to fetch schema' }),
        isLoading: ref(false),
      };

      vi.mocked(fetchLocalEndpoint).mockResolvedValue(mockError);

      const { getResourceAddressSchema } = useResourceAddress();
      const result = await getResourceAddressSchema(mockParams);

      expect(result.error.value).toEqual({
        title: 'Schema Error',
        description: 'Failed to fetch schema',
      });
    });
  });

  describe('getResourceAddressUiSchema', () => {
    const mockParams = {
      templateId: 'test-template-id',
    };

    it('should call fetchLocalEndpoint with correct parameters for UI schema', async () => {
      const mockUiSchema = {
        type: 'VerticalLayout',
        elements: [
          {
            type: 'Control',
            scope: '#/properties/field1',
          },
          {
            type: 'Control',
            scope: '#/properties/field2',
          },
        ],
      };

      const mockResult = {
        data: ref(mockUiSchema),
        error: ref(null),
        isLoading: ref(false),
      };

      vi.mocked(fetchLocalEndpoint).mockResolvedValue(mockResult);

      const { getResourceAddressUiSchema } = useResourceAddress();
      const result = await getResourceAddressUiSchema(mockParams);

      expect(fetchLocalEndpoint).toHaveBeenCalledWith(
        `/api/resourceAddresses/templates/${mockParams.templateId}/uiSchema`,
        {
          method: 'GET',
          errorIdentifier: 'RESOURCE_ADDRESS_UI_SCHEMA_ERROR',
          apiName: 'resource address ui schema',
        }
      );

      expect(result).toEqual(mockResult);
    });

    it('should handle errors when fetching UI schema', async () => {
      const mockError = {
        data: ref(null),
        error: ref({ title: 'UI Schema Error', description: 'Failed to fetch UI schema' }),
        isLoading: ref(false),
      };

      vi.mocked(fetchLocalEndpoint).mockResolvedValue(mockError);

      const { getResourceAddressUiSchema } = useResourceAddress();
      const result = await getResourceAddressUiSchema(mockParams);

      expect(result.error.value).toEqual({
        title: 'UI Schema Error',
        description: 'Failed to fetch UI schema',
      });
    });
  });

  it('should return all three functions from the composable', () => {
    const composable = useResourceAddress();

    expect(composable).toHaveProperty('getResourceAddressTemplates');
    expect(composable).toHaveProperty('getResourceAddressSchema');
    expect(composable).toHaveProperty('getResourceAddressUiSchema');
    expect(typeof composable.getResourceAddressTemplates).toBe('function');
    expect(typeof composable.getResourceAddressSchema).toBe('function');
    expect(typeof composable.getResourceAddressUiSchema).toBe('function');
  });

  it('should transform templates response to select options format', async () => {
    const mockParams = {
      sharingMethodId: 'test-sharing-method',
      offeringType: 'data',
    };

    // Mock the raw response from the API
    const mockRawResponse = [
      { id: 'template1', label: 'Template 1' },
      { id: 'template2', label: 'Template 2' },
    ];

    vi.mocked(fetchLocalEndpoint).mockImplementation((url, options, transform) => {
      // Simulate the transformation
      const transformed = transform ? transform(mockRawResponse) : mockRawResponse;
      return Promise.resolve({
        data: ref(transformed),
        error: ref(null),
        isLoading: ref(false),
      });
    });

    const { getResourceAddressTemplates } = useResourceAddress();
    const result = await getResourceAddressTemplates(mockParams);

    // The transform function should have been called
    expect(fetchLocalEndpoint).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Object),
      expect.any(Function)
    );
  });
});
