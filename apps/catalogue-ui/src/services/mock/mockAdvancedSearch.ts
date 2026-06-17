import fs from 'fs';

export const getSchemas = async (keycloakToken?: string): Promise<Response> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const mockShapesResponse = {
    Service: [
      'infrastructure-offeringShape.ttl',
      'data-offeringShape.ttl',
      'application-offeringShape.ttl',
    ],
    Contract: ['contract-templateShape.ttl'],
  } as const;

  return new Response(JSON.stringify(mockShapesResponse), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const fetchSchemaData = async (
  shapeId: string,
  keycloakToken?: string
): Promise<Response> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  const mockTtlContent = fs.readFileSync('/test/fixtures/testingShape.ttl', 'utf-8');

  return new Response(mockTtlContent, {
    status: 200,
    headers: { 'Content-Type': 'text/turtle' },
  });
};
