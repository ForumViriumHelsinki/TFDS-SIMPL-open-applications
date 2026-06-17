// Import all services statically
import * as realContractConsumption from './contractConsumption';
import * as mockContractConsumption from './mock/mockContractConsumption';
import * as realSearch from './search';
import * as mockSearch from './mock/mockSearch';
import * as realTransferProcess from './transferProcess';
import * as mockTransferProcess from './mock/mockTransferProcess';
import * as realAdvancedSearch from './advancedSearch';
import * as mockAdvancedSearch from './mock/mockAdvancedSearch';
import * as realResourceAddress from './resourceAddress';
import * as mockResourceAddress from './mock/mockResourceAddress';

const useMocks = import.meta.env.USE_MOCK_APIS === 'true' || !!import.meta.env.USE_MOCK_APIS;

export function createServiceSelector<T>(realService: T, mockService: T): T {
  return useMocks ? mockService : realService;
}

const SERVICE_MAPPINGS = {
  contractConsumption: {
    real: realContractConsumption,
    mock: mockContractConsumption,
  },
  search: {
    real: realSearch,
    mock: mockSearch,
  },
  transferProcess: {
    real: realTransferProcess,
    mock: mockTransferProcess,
  },
  advancedSearch: {
    real: realAdvancedSearch,
    mock: mockAdvancedSearch,
  },
  resourceAddress: {
    real: realResourceAddress,
    mock: mockResourceAddress,
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
