import { describe, it, vi, expect } from 'vitest';

// Mock all service modules to prevent module-level side effects (getPublicEnv calls etc.)
vi.mock('@/services/sdtooling', () => ({}));
vi.mock('@/services/mocks/mockSdtooling', () => ({}));
vi.mock('@/services/signer', () => ({}));
vi.mock('@/services/assetOrchestrator', () => ({}));
vi.mock('@/services/mocks/mockAssetOrchestrator', () => ({}));
vi.mock('@/services/deploymentScript', () => ({
  getDeploymentScripts: vi.fn(),
}));

import { createMappedServiceSelector } from '@/services/util/serviceSelector';
import * as deploymentScriptModule from '@/services/deploymentScript';

describe('serviceSelector', () => {
  describe('createMappedServiceSelector', () => {
    it('resolves "deploymentScript" without throwing', async () => {
      await expect(createMappedServiceSelector('deploymentScript')).resolves.toBeDefined();
    });

    it('returns an object containing getDeploymentScripts for "deploymentScript"', async () => {
      const service = await createMappedServiceSelector('deploymentScript');

      expect(typeof service.getDeploymentScripts).toBe('function');
    });

    it('deploymentScript maps to the deploymentScript module (real === mock)', async () => {
      const service = await createMappedServiceSelector('deploymentScript');

      expect(service).toBe(deploymentScriptModule);
    });

    it('resolves all registered service names without throwing', async () => {
      const names = ['sdtooling', 'signer', 'assetOrchestrator', 'deploymentScript'] as const;

      for (const name of names) {
        await expect(createMappedServiceSelector(name)).resolves.toBeDefined();
      }
    });
  });
});
