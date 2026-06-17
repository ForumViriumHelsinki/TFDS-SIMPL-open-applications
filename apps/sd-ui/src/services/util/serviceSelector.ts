import * as realSdtooling from '@/services/sdtooling';
import * as mockSdtooling from '@/services/mocks/mockSdtooling';
import * as realSigner from '@/services/signer';
import * as realAssetOrchestrator from '@/services/assetOrchestrator';
import * as mockAssetOrchestrator from '@/services/mocks/mockAssetOrchestrator';
import * as realDeploymentScript from '@/services/deploymentScript';

const useMocks = import.meta.env.USE_MOCK_APIS === 'true' || !!import.meta.env.USE_MOCK_APIS;

export function createServiceSelector<T>(realService: T, mockService: T): T {
  return useMocks ? mockService : realService;
}

const SERVICE_MAPPINGS = {
  sdtooling: {
    real: realSdtooling,
    mock: mockSdtooling,
  },
  signer: {
    real: realSigner,
    mock: realSigner,
  },
  assetOrchestrator: {
    real: realAssetOrchestrator,
    mock: mockAssetOrchestrator,
  },
  deploymentScript: {
    real: realDeploymentScript,
    mock: realDeploymentScript,
  },
} as const;

export type ServiceName = keyof typeof SERVICE_MAPPINGS;

export const createMappedServiceSelector = (serviceName: ServiceName) => {
  if (useMocks) {
    console.log(`Using service: ${serviceName}, Mocks enabled: ${useMocks}`);
  }
  const mapping = SERVICE_MAPPINGS[serviceName];
  const service = useMocks ? mapping.mock : mapping.real;

  return Promise.resolve(service);
};
