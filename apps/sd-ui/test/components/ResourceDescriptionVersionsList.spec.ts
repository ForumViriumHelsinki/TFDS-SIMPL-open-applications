import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { reactive } from 'vue';
import ResourceDescriptionVersionsList from '@/components/ResourceDescriptionVersionsList.vue';
import { useResourceDescriptionVersionsStore } from '@/store/resourceDescriptionVersions';

const mocks = vi.hoisted(() => {
  const ResourceDescriptionCard = {
    template: '<div class="resource-description-card"></div>',
    props: ['searchResult', 'cardButton', 'showMoreDetails'],
  };
  const SStatusMessage = {
    template: '<div class="s-status-message"><slot /></div>',
    props: ['variant', 'title', 'id'],
  };
  const SPaginator = {
    template: '<div class="s-paginator"></div>',
    props: ['totalRecords', 'currentPage', 'rowsPerPage', 'id'],
    emits: ['update:currentPage', 'update:rowsPerPage'],
  };
  const SOverlay = {
    template: '<div class="s-overlay"><slot /></div>',
    props: ['id', 'modelValue', 'title', 'class'],
    emits: ['update:modelValue', 'hide'],
  };
  return { ResourceDescriptionCard, SStatusMessage, SPaginator, SOverlay };
});

vi.mock('@simpl/vue-components', () => mocks);

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

vi.mock('@/store/resourceDescriptionVersions', () => ({
  useResourceDescriptionVersionsStore: vi.fn(),
}));

describe('ResourceDescriptionVersionsList.vue', () => {
  let storeMock: any;

  beforeEach(() => {
    vi.clearAllMocks();

    storeMock = reactive({
      versionsData: null,
      versionsError: null,
      currentPage: 1,
      pageSize: 10,
      getCardButton: vi.fn().mockReturnValue({ href: '#' }),
      initialize: vi.fn(),
      setPage: vi.fn(),
      setPageSize: vi.fn(),
    });

    vi.mocked(useResourceDescriptionVersionsStore).mockReturnValue(storeMock);
  });

  const mountComponent = (resourceDescriptionId = 'rd-123') =>
    mount(ResourceDescriptionVersionsList, {
      props: { resourceDescriptionId },
      global: {
        stubs: {
          ResourceDescriptionCard: mocks.ResourceDescriptionCard,
          SStatusMessage: mocks.SStatusMessage,
          SPaginator: mocks.SPaginator,
        },
      },
    });

  it('calls initialize with the resourceDescriptionId on mount', () => {
    mountComponent('rd-abc');
    expect(storeMock.initialize).toHaveBeenCalledWith('rd-abc');
  });

  it('renders cards when data is available', async () => {
    storeMock.versionsData = {
      totalCount: 2,
      items: [
        { claimsGraphUri: ['id-1'], offeringType: 'service', name: 'v2' },
        { claimsGraphUri: ['id-1'], offeringType: 'service', name: 'v1' },
      ],
    };

    const wrapper = mountComponent();
    await wrapper.vm.$nextTick();

    const cards = wrapper.findAllComponents(mocks.ResourceDescriptionCard);
    expect(cards).toHaveLength(2);
    expect(storeMock.getCardButton).toHaveBeenCalledTimes(2);
  });

  it('shows resource description name and id in the heading', async () => {
    const wrapper = mountComponent('id-1');
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('id-1');
  });

  it('shows resource description name when passed as prop', async () => {
    const wrapper = mount(ResourceDescriptionVersionsList, {
      props: { resourceDescriptionId: 'id-1', resourceDescriptionName: 'My Service Offering' },
      global: {
        stubs: {
          ResourceDescriptionCard: mocks.ResourceDescriptionCard,
          SStatusMessage: mocks.SStatusMessage,
          SPaginator: mocks.SPaginator,
        },
      },
    });
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('My Service Offering');
    expect(wrapper.text()).toContain('id-1');
  });

  it('renders no versions message when items list is empty', async () => {
    storeMock.versionsData = { totalCount: 0, items: [] };

    const wrapper = mountComponent();
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('No versions found');
  });

  it('renders an error status message when versionsError is set', async () => {
    storeMock.versionsError = { title: 'Error', description: 'Failed to load versions' };

    const wrapper = mountComponent();
    await wrapper.vm.$nextTick();

    const errorMsg = wrapper.findComponent(mocks.SStatusMessage);
    expect(errorMsg.exists()).toBe(true);
    expect(errorMsg.props('title')).toBe('Error');
    expect(wrapper.text()).toContain('Failed to load versions');
  });
});
