import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import PolicyConstraints from '@/components/contracts/PolicyConstraints.vue';
import PolicyConstraint from '@/components/contracts/PolicyConstraint.vue';

describe('PolicyConstraints.vue', () => {
  it('renders the correct number of PolicyConstraint components', () => {
    const constraints = [
      { condition: 'deletion' as 'deletion', conditionOperator: 'equals', conditionValue: 'true' },
      { condition: 'retention' as '', conditionOperator: 'greaterThan', conditionValue: '30' },
    ];

    const wrapper = mount(PolicyConstraints, {
      props: {
        constraints,
      },
    });

    // Check if the correct number of PolicyConstraint components are rendered
    const policyConstraints = wrapper.findAll('.policy-constraint');
    expect(policyConstraints.length).toBe(2);
  });

  it('passes the correct props to each PolicyConstraint component', () => {
    const constraints = [
      { condition: 'deletion' as 'deletion', conditionOperator: 'equals', conditionValue: 'true' },
      { condition: 'retention' as '', conditionOperator: 'greaterThan', conditionValue: '30' },
    ];

    const wrapper = mount(PolicyConstraints, {
      props: {
        constraints,
      },
    });

    const policyConstraintComponents = wrapper.findAllComponents(PolicyConstraint);
    expect(policyConstraintComponents.length).toBe(2);

    // Check if the correct props are passed to each PolicyConstraint component
    expect(policyConstraintComponents[0].props('constraint')).toEqual(constraints[0]);
    expect(policyConstraintComponents[1].props('constraint')).toEqual(constraints[1]);
  });

  it('renders no PolicyConstraint components when constraints array is empty', () => {
    const constraints: any[] = [];

    const wrapper = mount(PolicyConstraints, {
      props: {
        constraints,
      },
    });

    // Check if no PolicyConstraint components are rendered
    const policyConstraints = wrapper.findAll('.policy-constraint');
    expect(policyConstraints.length).toBe(0);
  });

  it('renders SStatusMessage with correct id attribute', () => {
    const constraints = [
      { condition: 'deletion' as 'deletion', conditionOperator: 'equals', conditionValue: 'true' },
    ];

    const wrapper = mount(PolicyConstraints, {
      props: {
        constraints,
      },
    });

    const statusMessage = wrapper.findComponent({ name: 'SStatusMessage' });
    expect(statusMessage.attributes('id')).toBe('policy-constraints');
  });
});
