import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import FormattedNumberRangeValue from '@/components/search/FormattedNumberRangeValue.vue';

describe('FormattedNumberRangeValue.vue', () => {
  it('renders the correct range when op1 indicates a minimum value', () => {
    const wrapper = mount(FormattedNumberRangeValue, {
      props: {
        label: 'Price',
        numberRange: {
          op1: '>=',
          value1: 10,
          op2: '<=',
          value2: 50,
        },
      },
    });

    expect(wrapper.text()).toContain('10');
    expect(wrapper.text()).toContain('<=');
    expect(wrapper.text()).toContain('50');
    expect(wrapper.text()).toContain('Price');
  });

  it('renders the correct range when op1 indicates a maximum value', () => {
    const wrapper = mount(FormattedNumberRangeValue, {
      props: {
        label: 'Price',
        numberRange: {
          op1: '<=',
          value1: 50,
        },
      },
    });

    expect(wrapper.text()).toContain('<=');
    expect(wrapper.text()).toContain('50');
    expect(wrapper.text()).toContain('Price');
  });

  it('renders the correct range when op2 indicates a minimum value', () => {
    const wrapper = mount(FormattedNumberRangeValue, {
      props: {
        label: 'Price',
        numberRange: {
          op1: '<=',
          value1: 50,
          op2: '>=',
          value2: 10,
        },
      },
    });

    expect(wrapper.text()).toContain('10');
    expect(wrapper.text()).toContain('<=');
    expect(wrapper.text()).toContain('50');
    expect(wrapper.text()).toContain('Price');
  });

  it('renders only the label when no range values are provided', () => {
    const wrapper = mount(FormattedNumberRangeValue, {
      props: {
        label: 'Price',
        numberRange: {
          op1: '',
          value1: null,
        },
      },
    });

    expect(wrapper.text()).toBe('Price');
  });
});
