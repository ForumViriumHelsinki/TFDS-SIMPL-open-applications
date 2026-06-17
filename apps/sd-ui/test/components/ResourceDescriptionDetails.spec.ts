import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import ResourceDescriptionDetails from '@/components/ResourceDescriptionDetails.vue';
import type { PossibleUIError } from '@simpl/vue-components';

// Hoist mocks to be available in vi.mock
const mocks = vi.hoisted(() => {
  const SStatusMessage = {
    name: 'SStatusMessage',
    template: '<div class="s-status-message" data-testid="status-message"><slot /></div>',
    props: ['id', 'variant', 'title'],
  };
  const ResourceDescriptionRendererHost = {
    name: 'ResourceDescriptionRendererHost',
    template: '<div class="resource-description-renderer-host" data-testid="renderer-host"></div>',
    props: ['detailedInput', 'showNavigation'],
  };

  return {
    SStatusMessage,
    ResourceDescriptionRendererHost,
  };
});

vi.mock('@simpl/vue-components', () => ({
  SStatusMessage: mocks.SStatusMessage,
  ResourceDescriptionRendererHost: mocks.ResourceDescriptionRendererHost,
}));

describe('ResourceDescriptionDetails.vue', () => {
  describe('when resourceDescriptionError is provided', () => {
    it('should render SStatusMessage with error details', () => {
      const error: PossibleUIError = {
        title: 'Error Title',
        description: 'Error description text',
      };

      const wrapper = mount(ResourceDescriptionDetails, {
        props: {
          detailedInput: null,
          resourceDescriptionError: error,
        },
        global: {
          stubs: {
            SStatusMessage: mocks.SStatusMessage,
            ResourceDescriptionRendererHost: mocks.ResourceDescriptionRendererHost,
          },
        },
      });

      const statusMessage = wrapper.findComponent({ name: 'SStatusMessage' });
      expect(statusMessage.exists()).toBe(true);
      expect(statusMessage.props('title')).toBe('Error Title');
      expect(statusMessage.props('variant')).toBe('danger');
      expect(statusMessage.text()).toContain('Error description text');
    });

    it('should render SStatusMessage with correct id attribute', () => {
      const error: PossibleUIError = {
        title: 'Error Title',
        description: 'Error description',
      };

      const wrapper = mount(ResourceDescriptionDetails, {
        props: {
          detailedInput: null,
          resourceDescriptionError: error,
        },
        global: {
          stubs: {
            SStatusMessage: mocks.SStatusMessage,
            ResourceDescriptionRendererHost: mocks.ResourceDescriptionRendererHost,
          },
        },
      });

      const statusMessage = wrapper.findComponent({ name: 'SStatusMessage' });
      expect(statusMessage.props('id')).toBe('resource-description-error-message');
    });
  });

  describe('when resourceDescriptionError is null', () => {
    it('should not render SStatusMessage', () => {
      const wrapper = mount(ResourceDescriptionDetails, {
        props: {
          detailedInput: null,
          resourceDescriptionError: null,
        },
        global: {
          stubs: {
            SStatusMessage: mocks.SStatusMessage,
            ResourceDescriptionRendererHost: mocks.ResourceDescriptionRendererHost,
          },
        },
      });

      const statusMessage = wrapper.findComponent({ name: 'SStatusMessage' });
      expect(statusMessage.exists()).toBe(false);
    });
  });

  describe('when detailedInput is provided', () => {
    it('should render ResourceDescriptionRendererHost with the detailed input', () => {
      const detailedInput = {
        label: 'Test Resource',
        value: 'Test Value',
      };

      const wrapper = mount(ResourceDescriptionDetails, {
        props: {
          detailedInput,
          resourceDescriptionError: null,
        },
        global: {
          stubs: {
            SStatusMessage: mocks.SStatusMessage,
            ResourceDescriptionRendererHost: mocks.ResourceDescriptionRendererHost,
          },
        },
      });

      const rendererHost = wrapper.findComponent({ name: 'ResourceDescriptionRendererHost' });
      expect(rendererHost.exists()).toBe(true);
      expect(rendererHost.props('detailedInput')).toEqual(detailedInput);
    });
  });

  describe('when detailedInput is null', () => {
    it('should not render ResourceDescriptionRendererHost', () => {
      const wrapper = mount(ResourceDescriptionDetails, {
        props: {
          detailedInput: null,
          resourceDescriptionError: null,
        },
        global: {
          stubs: {
            SStatusMessage: mocks.SStatusMessage,
            ResourceDescriptionRendererHost: mocks.ResourceDescriptionRendererHost,
          },
        },
      });

      const rendererHost = wrapper.findComponent({ name: 'ResourceDescriptionRendererHost' });
      expect(rendererHost.exists()).toBe(false);
    });
  });

  describe('when both resourceDescriptionError and detailedInput are provided', () => {
    it('should render both SStatusMessage and ResourceDescriptionRendererHost', () => {
      const error: PossibleUIError = {
        title: 'Warning',
        description: 'Some warning message',
      };
      const detailedInput = {
        label: 'Test Resource',
        value: 'Test Value',
      };

      const wrapper = mount(ResourceDescriptionDetails, {
        props: {
          detailedInput,
          resourceDescriptionError: error,
        },
        global: {
          stubs: {
            SStatusMessage: mocks.SStatusMessage,
            ResourceDescriptionRendererHost: mocks.ResourceDescriptionRendererHost,
          },
        },
      });

      expect(wrapper.findComponent({ name: 'SStatusMessage' }).exists()).toBe(true);
      expect(wrapper.findComponent({ name: 'ResourceDescriptionRendererHost' }).exists()).toBe(
        true
      );
    });
  });
});
