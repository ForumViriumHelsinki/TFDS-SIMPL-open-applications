import { describe, it, expect, beforeEach, vi, beforeAll, afterAll } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref, reactive } from 'vue';
import { useResourceDescriptionListStore } from '@/store/resourceDescriptionList';
import { useSchemasStore } from '@/store/schemas';
import { useTemporarySuccessMessageStore } from '@/store/temporarySuccessMessage';
import { useResourceDescriptions } from '@/services/composables/useResourceDescriptions';
import { getResourceDescriptionSummaryFromResult } from '@simpl/vue-components';

// Mock pinia storeToRefs to avoid issues with null values in mocks
vi.mock('pinia', async () => {
  const actual = await vi.importActual('pinia');
  const { toRef } = (await vi.importActual('vue')) as any;
  return {
    ...actual,
    storeToRefs: (store: any) => {
      const refs: any = {};
      for (const key in store) {
        refs[key] = toRef(store, key);
      }
      return refs;
    },
  };
});

// Mock external dependencies
vi.mock('@/services/composables/useResourceDescriptions');
vi.mock('@/store/schemas');
vi.mock('@/store/temporarySuccessMessage');
vi.mock('@simpl/vue-components', async () => {
  return {
    getResourceDescriptionSummaryFromResult: vi.fn(),
  };
});

describe('resourceDescriptionListStore', () => {
  const mockClearSuccessDetails = vi.fn();
  const mockGetResourceDescriptions = vi.fn();

  const originalLocation = window.location;
  const mockAssign = vi.fn();

  beforeAll(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { assign: mockAssign },
    });
  });

  afterAll(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();

    // Setup store mocks
    vi.mocked(useSchemasStore).mockReturnValue(
      reactive({
        schemas: [],
        schemasError: null,
      }) as any
    );

    vi.mocked(useTemporarySuccessMessageStore).mockReturnValue(
      reactive({
        showSuccessMessage: false,
        successId: null,
        successOfferingName: null,
        successAction: null,
        clearSuccessDetails: mockClearSuccessDetails,
      }) as any
    );

    vi.mocked(useResourceDescriptions).mockReturnValue({
      getResourceDescriptions: mockGetResourceDescriptions,
    } as any);

    // Default mock for getResourceDescriptions
    mockGetResourceDescriptions.mockResolvedValue({
      data: ref([]),
      error: ref(null),
    });

    // Default mock for getResourceDescriptionSummaryFromResult
    vi.mocked(getResourceDescriptionSummaryFromResult).mockImplementation((item: any) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      offeringType: 'data-offering',
      creationDate: '2023-01-01',
      status: 'active',
    }));
  });

  it('should initialize and fetch resource descriptions', async () => {
    const store = useResourceDescriptionListStore();

    expect(mockGetResourceDescriptions).toHaveBeenCalledWith('publicationDate');
    expect(store.sortBy).toBe('publicationDate');
  });

  describe('initializeListView', () => {
    it('should set local success message and clear store details', () => {
      // Setup success message in temporary store
      vi.mocked(useTemporarySuccessMessageStore).mockReturnValue(
        reactive({
          showSuccessMessage: true,
          successId: '123',
          successOfferingName: 'Test Offering',
          successAction: 'published',
          clearSuccessDetails: mockClearSuccessDetails,
        }) as any
      );

      const store = useResourceDescriptionListStore();

      store.initializeListView();

      const successStatus = store.displayedStatuses.find((s: any) => s.variant === 'success');
      expect(successStatus).toBeDefined();
      expect(successStatus?.title).toBe('Resource description published');
      expect(successStatus?.description).toContain('Test Offering');
      expect(successStatus?.description).toContain('123');

      expect(mockClearSuccessDetails).toHaveBeenCalled();
    });

    it('should show revoke success message when action is revoked', () => {
      vi.mocked(useTemporarySuccessMessageStore).mockReturnValue(
        reactive({
          showSuccessMessage: true,
          successId: 'revoked-id',
          successOfferingName: 'My Offering',
          successAction: 'revoked',
          clearSuccessDetails: mockClearSuccessDetails,
        }) as any
      );

      const store = useResourceDescriptionListStore();
      store.initializeListView();

      const successStatus = store.displayedStatuses.find((s: any) => s.variant === 'success');
      expect(successStatus).toBeDefined();
      expect(successStatus?.title).toBe('Resource description revoked');
      expect(successStatus?.description).toContain('My Offering');
      expect(successStatus?.description).toContain('successfully revoked');
      expect(mockClearSuccessDetails).toHaveBeenCalled();
    });

    it('should not set local success message if temporary store is empty', () => {
      const store = useResourceDescriptionListStore();

      store.initializeListView();

      const successStatus = store.displayedStatuses.find((s: any) => s.variant === 'success');
      expect(successStatus).toBeUndefined();
      expect(mockClearSuccessDetails).toHaveBeenCalled();
    });
  });

  describe('newSchemaOptions', () => {
    it('should map schemas to dropdown items', () => {
      vi.mocked(useSchemasStore).mockReturnValue(
        reactive({
          schemas: [
            { value: 'schema1', label: 'Schema 1' },
            { value: 'schema2', label: 'Schema 2' },
          ],
          schemasError: null,
        }) as any
      );

      const store = useResourceDescriptionListStore();

      expect(store.newSchemaOptions).toEqual([
        { id: 'schema1', label: 'Schema 1' },
        { id: 'schema2', label: 'Schema 2' },
      ]);
    });
  });

  describe('handleCreateNewDropdownClick', () => {
    it('should redirect to create page', () => {
      const store = useResourceDescriptionListStore();
      const item = { id: 'schema1', label: 'Schema 1' };

      store.handleCreateNewDropdownClick(item);

      expect(mockAssign).toHaveBeenCalledWith('/resourceDescriptions/schema1/new');
    });
  });

  describe('getCardButton', () => {
    it('should return correct link', () => {
      const store = useResourceDescriptionListStore();
      const item = { id: 'res1' };

      const button = store.getCardButton(item as any);

      expect(button.href).toBe('/resourceDescriptions/res1');
    });
  });

  describe('getPreviousVersionsButton', () => {
    it('should include the name query param when title is available', () => {
      vi.mocked(getResourceDescriptionSummaryFromResult).mockImplementation((item: any) => ({
        id: item.id,
        title: 'My Resource',
      } as any));

      const store = useResourceDescriptionListStore();
      const button = store.getPreviousVersionsButton({ id: 'res-1' } as any);

      expect(button.href).toBe('/resourceDescriptions/res-1/versions?name=My+Resource');
    });

    it('should omit the name query param when title is absent', () => {
      vi.mocked(getResourceDescriptionSummaryFromResult).mockImplementation((item: any) => ({
        id: item.id,
        title: undefined,
      } as any));

      const store = useResourceDescriptionListStore();
      const button = store.getPreviousVersionsButton({ id: 'res-2' } as any);

      expect(button.href).toBe('/resourceDescriptions/res-2/versions?');
    });
  });

  describe('displayedStatuses', () => {
    it('should display schema errors', () => {
      vi.mocked(useSchemasStore).mockReturnValue(
        reactive({
          schemas: [],
          schemasError: { title: 'Schema Error', description: 'Failed to load' },
        }) as any
      );

      const store = useResourceDescriptionListStore();

      const errorStatus = store.displayedStatuses.find((s: any) => s.title === 'Schema Error');
      expect(errorStatus).toBeDefined();
      expect(errorStatus?.variant).toBe('danger');
    });

    it('should display resource description errors', async () => {
      mockGetResourceDescriptions.mockResolvedValue({
        data: ref(null),
        error: ref({ title: 'Fetch Error', description: 'Failed to fetch' }),
      });

      const store = useResourceDescriptionListStore();
      // Trigger watch
      store.sortBy = 'resourceType';
      await vi.waitFor(() => {
        expect(store.resourceDescriptionsError).not.toBeNull();
      });

      const errorStatus = store.displayedStatuses.find((s: any) => s.title === 'Fetch Error');
      expect(errorStatus).toBeDefined();
      expect(errorStatus?.variant).toBe('danger');
    });
  });

  describe('sorting', () => {
    it('should refetch when sortBy changes', async () => {
      const store = useResourceDescriptionListStore();

      store.sortBy = 'resourceType';

      await vi.waitFor(() => {
        expect(mockGetResourceDescriptions).toHaveBeenCalledWith('resourceType');
      });
    });
  });
});
