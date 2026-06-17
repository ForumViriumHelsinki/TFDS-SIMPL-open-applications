import mockResults from './fixtures/mockResults.json';
import mockSDData from './fixtures/mockSDdata.json';

export const fetchQuickSearchResponse = async (
  text: string | null,
  keycloakToken?: string
): Promise<Response> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  const mockSearchResults = mockResults;

  return new Response(JSON.stringify(mockSearchResults), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const fetchAdvancedSearchResponse = async (
  requestBody: any,
  keycloakToken?: string
): Promise<Response> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1200));

  const mockAdvancedResults = mockResults;

  return new Response(JSON.stringify(mockAdvancedResults), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const getSelfDescriptionById = async (
  id: string,
  keycloakToken?: string
): Promise<Response> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 600));

  const mockSelfDescription = mockSDData;

  return new Response(JSON.stringify(mockSelfDescription), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
