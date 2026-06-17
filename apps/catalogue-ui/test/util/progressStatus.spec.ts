import { describe, it, expect } from 'vitest';
import {
  mapContractStatusToProgress,
  getProgressChipConfig,
  type DisplayedStatusLabel,
} from '@/util/progressStatus';

describe('progressStatus.ts', () => {
  describe('mapContractStatusToProgress', () => {
    it('returns undefined when status is undefined', () => {
      expect(mapContractStatusToProgress(undefined)).toBe(undefined);
    });

    it('returns undefined when status is null', () => {
      expect(mapContractStatusToProgress(null as any)).toBe(undefined);
    });

    it('returns undefined when status is empty string', () => {
      expect(mapContractStatusToProgress('')).toBe(undefined);
    });

    it('maps INITIAL status to In Progress', () => {
      expect(mapContractStatusToProgress('INITIAL')).toBe('In Progress');
      expect(mapContractStatusToProgress('initial')).toBe('In Progress');
      expect(mapContractStatusToProgress('Initial')).toBe('In Progress');
    });

    it('maps REQUESTED status to In Progress', () => {
      expect(mapContractStatusToProgress('REQUESTED')).toBe('In Progress');
      expect(mapContractStatusToProgress('requested')).toBe('In Progress');
      expect(mapContractStatusToProgress('Requested')).toBe('In Progress');
    });

    it('maps PROVISIONING status to In Progress', () => {
      expect(mapContractStatusToProgress('PROVISIONING')).toBe('In Progress');
      expect(mapContractStatusToProgress('provisioning')).toBe('In Progress');
      expect(mapContractStatusToProgress('Provisioning')).toBe('In Progress');
    });

    it('maps DEPROVISIONING status to In Progress', () => {
      expect(mapContractStatusToProgress('DEPROVISIONING')).toBe('In Progress');
      expect(mapContractStatusToProgress('deprovisioning')).toBe('In Progress');
      expect(mapContractStatusToProgress('Deprovisioning')).toBe('In Progress');
    });

    it('maps FINALIZED status to Successful', () => {
      expect(mapContractStatusToProgress('FINALIZED')).toBe('Successful');
      expect(mapContractStatusToProgress('finalized')).toBe('Successful');
      expect(mapContractStatusToProgress('Finalized')).toBe('Successful');
    });

    it('maps DEPROVISIONED status to Successful', () => {
      expect(mapContractStatusToProgress('DEPROVISIONED')).toBe('Successful');
      expect(mapContractStatusToProgress('deprovisioned')).toBe('Successful');
      expect(mapContractStatusToProgress('Deprovisioned')).toBe('Successful');
    });

    it('maps COMPLETED status to Successful', () => {
      expect(mapContractStatusToProgress('COMPLETED')).toBe('Successful');
      expect(mapContractStatusToProgress('completed')).toBe('Successful');
      expect(mapContractStatusToProgress('Completed')).toBe('Successful');
    });

    it('maps TERMINATED status to Failed', () => {
      expect(mapContractStatusToProgress('TERMINATED')).toBe('Failed');
      expect(mapContractStatusToProgress('terminated')).toBe('Failed');
      expect(mapContractStatusToProgress('Terminated')).toBe('Failed');
    });

    it('maps unknown status to In Progress (default case)', () => {
      expect(mapContractStatusToProgress('UNKNOWN_STATUS')).toBe('In Progress');
      expect(mapContractStatusToProgress('RANDOM')).toBe('In Progress');
      expect(mapContractStatusToProgress('PENDING')).toBe('In Progress');
    });
  });

  describe('getProgressChipConfig', () => {
    it('returns correct config for In Progress status', () => {
      const result = getProgressChipConfig('In Progress');
      
      expect(result).toEqual({
        label: 'In Progress',
        chipClasses: '!bg-warning-lightest !border-warning-base !text-warning-base',
        iconName: 'sync',
      });
    });

    it('returns correct config for Successful status', () => {
      const result = getProgressChipConfig('Successful');
      
      expect(result).toEqual({
        label: 'Successful',
        chipClasses: '!bg-success-light !border-success-base !text-success-base',
        iconName: 'checkmark-circle',
      });
    });

    it('returns correct config for Failed status', () => {
      const result = getProgressChipConfig('Failed');
      
      expect(result).toEqual({
        label: 'Failed',
        chipClasses: '!bg-danger-lightest !border-danger-base !text-danger-base',
        iconName: 'alert-circle',
      });
    });

    it('returns default config for unknown status', () => {
      const unknownStatus = 'Unknown Status' as DisplayedStatusLabel;
      const result = getProgressChipConfig(unknownStatus);
      
      expect(result).toEqual({
        label: 'Unknown Status',
        chipClasses: '!bg-neutral-light !border-neutral-base !text-neutral-base',
        iconName: '',
      });
    });
  });

  describe('integration: mapContractStatusToProgress + getProgressChipConfig', () => {
    it('correctly maps status chain from raw status to chip config', () => {
      // Test the full chain: raw status -> mapped status -> chip config
      const rawStatus = 'FINALIZED';
      const mappedStatus = mapContractStatusToProgress(rawStatus);
      const chipConfig = getProgressChipConfig(mappedStatus!);
      
      expect(mappedStatus).toBe('Successful');
      expect(chipConfig).toEqual({
        label: 'Successful',
        chipClasses: '!bg-success-light !border-success-base !text-success-base',
        iconName: 'checkmark-circle',
      });
    });

    it('handles case-insensitive status mapping correctly', () => {
      const rawStatus = 'terminated';
      const mappedStatus = mapContractStatusToProgress(rawStatus);
      const chipConfig = getProgressChipConfig(mappedStatus!);
      
      expect(mappedStatus).toBe('Failed');
      expect(chipConfig).toEqual({
        label: 'Failed',
        chipClasses: '!bg-danger-lightest !border-danger-base !text-danger-base',
        iconName: 'alert-circle',
      });
    });

    it('handles unknown status through the full chain', () => {
      const rawStatus = 'WEIRD_STATUS';
      const mappedStatus = mapContractStatusToProgress(rawStatus);
      const chipConfig = getProgressChipConfig(mappedStatus!);
      
      expect(mappedStatus).toBe('In Progress');
      expect(chipConfig).toEqual({
        label: 'In Progress',
        chipClasses: '!bg-warning-lightest !border-warning-base !text-warning-base',
        iconName: 'sync',
      });
    });
  });
});
