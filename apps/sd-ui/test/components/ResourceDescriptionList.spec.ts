import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { reactive } from 'vue';
import ResourceDescriptionList from '@/components/ResourceDescriptionList.vue';
import { useResourceDescriptionListStore } from '@/store/resourceDescriptionList';

// Hoist mocks to be available in vi.mock
const mocks = vi.hoisted(() => {
  const SStatusMessage = {
    template: '<div class="s-status-message"><slot /></div>',
    props: ['variant', 'title'],
  };
  const SDropdown = {
    template: '<div class="s-dropdown"></div>',
    props: ['items'],
    emits: ['item-click'],
  };
  const SButton = { template: '<button></button>' };
  const SSelect = {
    template:
      '<select class="s-select" :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"></select>',
    props: ['modelValue', 'options'],
    emits: ['update:modelValue'],
  };
  const ResourceDescriptionCard = {
    template: '<div class="resource-description-card"></div>',
    props: ['searchResult', 'cardButton'],
  };
  return {
    SStatusMessage,
    SDropdown,
    SButton,
    SSelect,
    ResourceDescriptionCard,
  };
});

vi.mock('@simpl/vue-components', () => mocks);

// Mock pinia storeToRefs
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

// Mock the store
vi.mock('@/store/resourceDescriptionList', () => ({
  useResourceDescriptionListStore: vi.fn(),
}));

describe('ResourceDescriptionList.vue', () => {
  let wrapper: any;
  let storeMock: any;
  const originalLocation = window.location;
  const mockReplaceState = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock window.location and history
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        href: 'http://localhost:3000/?newResourceDescriptionId=123',
        searchParams: new URLSearchParams('?newResourceDescriptionId=123'),
      },
    });

    Object.defineProperty(window, 'history', {
      configurable: true,
      value: { replaceState: mockReplaceState },
    });

    // Setup store mock
    storeMock = reactive({
      resourceDescriptionsData: null,
      resourceDescriptionsError: null,
      newSchemaOptions: [],
      displayedStatuses: [],
      schemasError: null,
      sortOptions: [{ label: 'Date', value: 'date' }],
      sortBy: 'date',
      getCardButton: vi.fn().mockReturnValue({ href: '#' }),
      getPreviousVersionsButton: vi.fn().mockReturnValue({ href: '#' }),
      handleCreateNewDropdownClick: vi.fn(),
      initializeListView: vi.fn(),
    });

    vi.mocked(useResourceDescriptionListStore).mockReturnValue(storeMock);

    wrapper = mount(ResourceDescriptionList, {
      global: {
        stubs: {
          SStatusMessage: mocks.SStatusMessage,
          SDropdown: mocks.SDropdown,
          SButton: mocks.SButton,
          SSelect: mocks.SSelect,
          ResourceDescriptionCard: mocks.ResourceDescriptionCard,
        },
      },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  it('should clear newResourceDescriptionId param on setup', () => {
    // This runs in setup, so we check if replaceState was called
    expect(mockReplaceState).toHaveBeenCalled();
  });

  it('should call initializeListView on mount', () => {
    expect(storeMock.initializeListView).toHaveBeenCalled();
  });

  it('should render status messages', async () => {
    storeMock.displayedStatuses = [
      { title: 'Error', description: 'Something went wrong', variant: 'danger' },
      { title: 'Success', description: 'All good', variant: 'success' },
    ];
    await wrapper.vm.$nextTick();

    const messages = wrapper.findAll('.s-status-message');
    expect(messages).toHaveLength(2);
    expect(messages[0].text()).toContain('Something went wrong');
  });

  it('should render create new dropdown when options available and no error', async () => {
    storeMock.newSchemaOptions = [{ id: '1', label: 'Schema 1' }];
    storeMock.schemasError = null;
    await wrapper.vm.$nextTick();

    expect(wrapper.findComponent(mocks.SDropdown).exists()).toBe(true);
  });

  it('should not render create new dropdown if schema error', async () => {
    storeMock.schemasError = { title: 'Error' };
    storeMock.newSchemaOptions = [{ id: '1', label: 'Schema 1' }];
    await wrapper.vm.$nextTick();

    expect(wrapper.findComponent(mocks.SDropdown).exists()).toBe(false);
  });

  it('should handle create new dropdown click', async () => {
    storeMock.newSchemaOptions = [{ id: '1', label: 'Schema 1' }];
    await wrapper.vm.$nextTick();

    const dropdown = wrapper.findComponent(mocks.SDropdown);
    dropdown.vm.$emit('item-click', { id: '1' });

    expect(storeMock.handleCreateNewDropdownClick).toHaveBeenCalledWith({ id: '1' });
  });

  it('should render resource descriptions list', async () => {
    storeMock.resourceDescriptionsData = {
      totalCount: 2,
      items: [{ title: 'Item 1' }, { title: 'Item 2' }],
    };
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('2 results');
    const cards = wrapper.findAllComponents(mocks.ResourceDescriptionCard);
    expect(cards).toHaveLength(2);
    expect(storeMock.getCardButton).toHaveBeenCalledTimes(2);
    expect(storeMock.getPreviousVersionsButton).toHaveBeenCalledTimes(2);
  });

  it('should render no results message', async () => {
    storeMock.resourceDescriptionsData = {
      totalCount: 0,
      items: [],
    };
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('No resource descriptions found');
  });

  it('should handle sort change', async () => {
    storeMock.resourceDescriptionsData = { totalCount: 0, items: [] };
    await wrapper.vm.$nextTick();

    const select = wrapper.findComponent(mocks.SSelect);
    select.vm.$emit('update:modelValue', 'newSort');

    expect(storeMock.sortBy).toBe('newSort');
  });
});
