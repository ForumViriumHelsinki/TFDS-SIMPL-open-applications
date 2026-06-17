import { fetchSchemaData } from '@/services/advancedSearch';
import { isValidSimplSDSchemaUIVariant } from '@/util/schema/types';
import { parseStream } from '@/util/ttlParser';
import formats from '@rdfjs/formats-common';
import type { Stream } from '@rdfjs/types';
import type { APIRoute } from 'astro';
import { Readable } from 'stream';

export const GET: APIRoute = async ({ url, cookies, params }) => {
  const token = cookies.get('token')?.value;
  const schemaId = params.schemaId;
  const schemaUIType = url.searchParams.get('schemaUIType');

  if (!schemaId) {
    return new Response(JSON.stringify({ errorDescription: 'Missing schemaId parameter' }), {
      status: 400,
    });
  }

  const response = await fetchSchemaData(schemaId, token);

  if (!response.ok) {
    return response;
  }

  const schemaContent = await response.text();
  const input = Readable.from(schemaContent);

  const output: Stream | null = formats.parsers.import('text/turtle', input);

  if (!output) {
    return new Response(JSON.stringify({ errorDescription: 'Failed to parse schema' }), {
      status: 500,
    });
  }

  try {
    const { root, prefixes } = await parseStream(
      output,
      isValidSimplSDSchemaUIVariant(schemaUIType) ? schemaUIType : 'default'
    );

    return new Response(
      JSON.stringify({
        root,
        prefixes,
      }),
      {
        headers: {
          'content-type': 'application/json',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        errorDescription: 'Failed to parse schema: ' + (error as Error).message,
      }),
      {
        status: 400,
        headers: {
          'content-type': 'application/json',
        },
      }
    );
  }
};
