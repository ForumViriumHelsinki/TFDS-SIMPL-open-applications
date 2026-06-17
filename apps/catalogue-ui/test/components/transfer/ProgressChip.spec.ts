import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import ProgressChip from '@/components/transfer/ProgressChip.vue';

// Mock the SChip component
vi.mock('@simpl/vue-components', () => ({
  SChip: {
    name: 'SChip',
    template: '<div class="mocked-chip"><span>{{ label }}</span></div>',
    props: ['label', 'icon', 'colorType', 'variant', 'rounded'],
  },
}));

// Mock the progress status utility
vi.mock('@/util/progressStatus', () => ({
  getProgressChipConfig: vi.fn((status: string) => ({
    label: status,
    chipClasses: 'test-class',
    iconName: 'test-icon',
  })),
}));

describe('ProgressChip.vue', () => {
  it('renders the component', () => {
    const wrapper = mount(ProgressChip, {
      props: {
        status: 'In Progress',
      },
    });

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.find('.mocked-chip').exists()).toBe(true);
  });

  it('displays the correct label', () => {
    const wrapper = mount(ProgressChip, {
      props: {
        status: 'In Progress',
      },
    });

    expect(wrapper.text()).toContain('In Progress');
  });

  it('renders chip with correct id attribute', () => {
    const wrapper = mount(ProgressChip, {
      props: {
        status: 'In Progress',
      },
    });

    const chip = wrapper.findComponent({ name: 'SChip' });
    expect(chip.attributes('id')).toBe('progress-status-chip');
  });
});
