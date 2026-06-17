import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ToolbarWrapper from '@/components/ToolbarWrapper.vue';

// Mock the SToolbar component
vi.mock('@simpl/vue-components', () => ({
  SToolbar: {
    name: 'SToolbar',
    props: [
      'logoRoute',
      'showSearch',
      'showUserProfile',
      'firstName',
      'lastName',
      'menuItems',
      'welcomeMessage',
    ],
    template: '<div class="s-toolbar-mock"></div>',
  },
}));

// Mock fetch
global.fetch = vi.fn();

describe('ToolbarWrapper.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete (window as any).location;
    (window as any).location = { href: '', assign: vi.fn() };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders SToolbar component', () => {
    const wrapper = mount(ToolbarWrapper, {
      props: {
        currentUrl: '',
      },
    });

    expect(wrapper.findComponent({ name: 'SToolbar' }).exists()).toBe(true);
  });

  it('passes correct props to SToolbar', () => {
    const wrapper = mount(ToolbarWrapper, {
      props: {
        currentUrl: 'http://localhost:3000',
      },
    });

    const toolbar = wrapper.findComponent({ name: 'SToolbar' });
    expect(toolbar.props('logoRoute')).toBe('/');
    expect(toolbar.props('showUserProfile')).toBe(true);
    expect(toolbar.props('welcomeMessage')).toBe('Welcome');
  });

  it('initializes with default firstName and lastName', () => {
    const wrapper = mount(ToolbarWrapper, {
      props: {
        currentUrl: '',
      },
    });

    const toolbar = wrapper.findComponent({ name: 'SToolbar' });
    expect(toolbar.props('firstName')).toBe('User');
    expect(toolbar.props('lastName')).toBe('Name');
  });

  it('fetches user info on mount and updates firstName and lastName', async () => {
    const mockUserInfo = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockUserInfo,
    });

    const wrapper = mount(ToolbarWrapper, {
      props: {
        currentUrl: '',
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
    await wrapper.vm.$nextTick();

    const toolbar = wrapper.findComponent({ name: 'SToolbar' });
    expect(toolbar.props('firstName')).toBe('John');
    expect(toolbar.props('lastName')).toBe('Doe');
  });

  it('uses fallback values when API returns empty firstName/lastName', async () => {
    const mockUserInfo = {
      firstName: '',
      lastName: '',
      email: 'user@example.com',
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockUserInfo,
    });

    const wrapper = mount(ToolbarWrapper, {
      props: {
        currentUrl: '',
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
    await wrapper.vm.$nextTick();

    const toolbar = wrapper.findComponent({ name: 'SToolbar' });
    expect(toolbar.props('firstName')).toBe('User');
    expect(toolbar.props('lastName')).toBe('Name');
  });

  it('handles API fetch error gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    const wrapper = mount(ToolbarWrapper, {
      props: {
        currentUrl: '',
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
    await wrapper.vm.$nextTick();

    const toolbar = wrapper.findComponent({ name: 'SToolbar' });
    expect(toolbar.props('firstName')).toBe('User');
    expect(toolbar.props('lastName')).toBe('Name');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to fetch user info:', expect.any(Error));

    consoleErrorSpy.mockRestore();
  });

  it('handles API response with non-ok status', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
    });

    const wrapper = mount(ToolbarWrapper, {
      props: {
        searchValue: '',
        currentUrl: '',
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
    await wrapper.vm.$nextTick();

    const toolbar = wrapper.findComponent({ name: 'SToolbar' });
    expect(toolbar.props('firstName')).toBe('User');
    expect(toolbar.props('lastName')).toBe('Name');
  });

  it('creates logout menu item when currentUrl is provided', () => {
    const currentUrl = 'http://localhost:3000/page';
    const wrapper = mount(ToolbarWrapper, {
      props: {
        currentUrl,
      },
    });

    const toolbar = wrapper.findComponent({ name: 'SToolbar' });
    const menuItems = toolbar.props('menuItems') as any[];

    expect(menuItems).toHaveLength(1);
    expect(menuItems[0].label).toBe('Logout');
    expect(menuItems[0].icon).toBe('pi pi-sign-out');
    expect(menuItems[0].command).toBeInstanceOf(Function);
  });

  it('does not create menu items when currentUrl is empty', () => {
    const wrapper = mount(ToolbarWrapper, {
      props: {
        currentUrl: '',
      },
    });

    const toolbar = wrapper.findComponent({ name: 'SToolbar' });
    const menuItems = toolbar.props('menuItems');

    expect(menuItems).toHaveLength(0);
  });

  it('logout menu item navigates to correct URL when clicked', () => {
    const currentUrl = 'http://localhost:3000/page';
    const wrapper = mount(ToolbarWrapper, {
      props: {
        currentUrl,
      },
    });

    const toolbar = wrapper.findComponent({ name: 'SToolbar' });
    const menuItems = toolbar.props('menuItems') as any[];

    // Execute the logout command
    menuItems[0].command({});

    expect(window.location.href).toBe(`/logout?redirectUri=${currentUrl}`);
  });

  it('handles search event and navigates to home page with query', async () => {
    const wrapper = mount(ToolbarWrapper, {
      props: {
        currentUrl: '',
      },
    });

    const toolbar = wrapper.findComponent({ name: 'SToolbar' });

    // Emit search event
    await toolbar.vm.$emit('search', 'test query');

    expect(window.location.assign).toHaveBeenCalledWith('/?search=test query');
  });

  it('does not navigate when search query is empty', async () => {
    const wrapper = mount(ToolbarWrapper, {
      props: {
        currentUrl: '',
      },
    });

    const toolbar = wrapper.findComponent({ name: 'SToolbar' });

    // Emit search event with empty query
    await toolbar.vm.$emit('search', '');

    expect(window.location.assign).not.toHaveBeenCalled();
  });

  it('passes currentUrl prop to component', () => {
    const wrapper = mount(ToolbarWrapper, {
      props: {
        currentUrl: 'http://localhost:3000/test',
      },
    });

    expect(wrapper.props('currentUrl')).toBe('http://localhost:3000/test');
  });

  it('uses default props when not provided', () => {
    const wrapper = mount(ToolbarWrapper);

    expect(wrapper.props('currentUrl')).toBe('');
  });
});
