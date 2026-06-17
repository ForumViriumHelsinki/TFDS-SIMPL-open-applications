import { createMappedServiceSelector, type ServiceName } from '@/services/serviceSelector';
import { createProblemDetailsResponse } from '@simpl/vue-components';

/**
 * Server side helper function to call APIs and handle fetch errors.
 * Also uses the service selector to either call the real or mock service.
 * @param serviceName - The name of the service to call.
 * @param methodName - The method of the service to invoke.
 * @param args - The arguments to pass to the service method.
 * @returns A Promise resolving to a Response object.
 */
export const safeServiceCall = async (
  serviceName: ServiceName,
  methodName: string,
  ...args: any[]
): Promise<Response> => {
  try {
    const service = await createMappedServiceSelector(serviceName);
    return await service[methodName](...args);
  } catch (error) {
    console.error(`API Error in ${serviceName}.${methodName}:`, error);
    return createProblemDetailsResponse(
      undefined,
      `Service unavailable`,
      503,
      `The service is currently unavailable. Please try again later. ${error}`,
      `${serviceName}.${methodName}`
    );
  }
};
