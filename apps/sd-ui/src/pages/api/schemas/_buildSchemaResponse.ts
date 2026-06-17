import { parseStream } from '@/util/ttlParser/ttlParser';
import { isValidSimplSDSchemaUIVariant } from '@/util/ttlParser/util';
import formats from '@rdfjs/formats-common';
import type { Stream } from '@rdfjs/types';
import { Readable } from 'stream';

export async function buildSchemaResponse(
  schemaContent: string,
  schemaUIType: string | null
): Promise<Response> {
  const input = Readable.from(schemaContent);
  const output = formats.parsers.import('text/turtle', input);

  if (!output) {
    return new Response(JSON.stringify({ errorDescription: 'Failed to parse schema' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }

  const { root, prefixes } = await parseStream(
    output as Stream,
    isValidSimplSDSchemaUIVariant(schemaUIType) ? schemaUIType : 'default'
  );

  const offeringShapeEntries = Object.entries(root).filter(([shapeName]) =>
    shapeName.endsWith('OfferingShape')
  );

  const filteredRoot =
    offeringShapeEntries.length > 0 ? Object.fromEntries(offeringShapeEntries) : root;

  return new Response(JSON.stringify({ root: filteredRoot, prefixes }), {
    headers: { 'content-type': 'application/json' },
  });
}
