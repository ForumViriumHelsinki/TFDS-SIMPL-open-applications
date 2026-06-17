import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { ref, reactive } from 'vue';
import { useResourceDescriptionVersionsStore } from '@/store/resourceDescriptionVersions';
import { useResourceDescriptions } from '@/services/composables/useResourceDescriptions';
import { getResourceDescriptionSummaryFromResult } from '@simpl/vue-components';

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

vi.mock('@/services/composables/useResourceDescriptions');
vi.mock('@simpl/vue-components', async () => ({
  getResourceDescriptionSummaryFromResult: vi.fn(),
}));

describe('resourceDescriptionVersionsStore', () => {
  const mockGetResourceDescriptionVersions = vi.fn();

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();

    vi.mocked(useResourceDescriptions).mockReturnValue({
      getResourceDescriptionVersions: mockGetResourceDescriptionVersions,
    } as any);

    mockGetResourceDescriptionVersions.mockResolvedValue({
      data: ref(null),
      error: ref(null),
    });

    vi.mocked(getResourceDescriptionSummaryFromResult).mockImplementation((item: any) => ({
      id: item.claimsGraphUri?.[0] ?? 'mock-id',
      title: item.name,
      description: item.description,
      offeringType: item.offeringType,
      creationDate: '2023-01-01',
      status: 'active',
    }));
  });

  it('does not fetch versions before initialize is called', () => {
    useResourceDescriptionVersionsStore();
    expect(mockGetResourceDescriptionVersions).not.toHaveBeenCalled();
  });

  it('fetches versions when initialize is called with an id', async () => {
    const versionsResponse = {
      totalCount: 2,
      items: [
        { claimsGraphUri: ['id-1'], offeringType: 'service', name: 'v2', description: 'Second' },
        { claimsGraphUri: ['id-1'], offeringType: 'service', name: 'v1', description: 'First' },
      ],
    };
    mockGetResourceDescriptionVersions.mockResolvedValue({
      data: ref(versionsResponse),
      error: ref(null),
    });

    const store = useResourceDescriptionVersionsStore();
    store.initialize('id-1');

    await new Promise((r) => setTimeout(r, 0));

    expect(mockGetResourceDescriptionVersions).toHaveBeenCalledWith('id-1', 1, 10);
    expect(store.versionsData).toEqual(versionsResponse);
    expect(store.versionsError).toBeNull();
  });

  it('sets versionsError when the fetch fails', async () => {
    const uiError = { title: 'Error', description: 'Failed to load' };
    mockGetResourceDescriptionVersions.mockResolvedValue({
      data: ref(null),
      error: ref(uiError),
    });

    const store = useResourceDescriptionVersionsStore();
    store.initialize('id-err');

    await new Promise((r) => setTimeout(r, 0));

    expect(store.versionsError).toEqual(uiError);
    expect(store.versionsData).toBeNull();
  });

  it('getCardButton returns href pointing to the resource description detail page', () => {
    const store = useResourceDescriptionVersionsStore();
    const item = { claimsGraphUri: ['web:did:abc'], offeringType: 'service', name: 'Test' } as any;

    const button = store.getCardButton(item);

    expect(button.href).toBe('/resourceDescriptions/web:did:abc?hideActions=true&returnUrl=%2F');
  });
});
