import { describe, it, expect } from 'vitest';
import { parseStream } from '@/util/ttlParser';
import fs from 'fs';
import path from 'path';
import formats from '@rdfjs/formats-common';
import type { Quad, Stream } from '@rdfjs/types';
import { Readable } from 'stream';

const expectedPrefixes = {
  'gax-validation': 'http://w3id.org/gaia-x/validation#',
  rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  sh: 'http://www.w3.org/ns/shacl#',
  simpl: 'http://w3id.org/gaia-x/simpl#',
  skos: 'http://www.w3.org/2004/02/skos/core#',
  xsd: 'http://www.w3.org/2001/XMLSchema#',
};

const openTestFileAsParsedTtlStream = (): Stream<Quad> => {
  const ttlFilePath = path.resolve(__dirname, '../../fixtures/testingShape.ttl');
  const ttlContent = fs.readFileSync(ttlFilePath, 'utf-8');
  const ttlStream = Readable.from(ttlContent);
  const output = formats.parsers.import('text/turtle', ttlStream);
  return output!;
};

describe('ttlParser', () => {
  it('should convert ttl to schema the default way', async () => {
    const testTtlStream = openTestFileAsParsedTtlStream();

    const { root, prefixes } = await parseStream(testTtlStream, 'default');
    const targetSchema = fs.readFileSync(
      path.resolve(__dirname, '../../fixtures/testingShape-default.json'),
      'utf-8'
    );
    expect(prefixes).toEqual(expectedPrefixes);
    expect(root).toEqual(JSON.parse(targetSchema));
  });

  it('should have prefixes', async () => {
    const sdCreatorSpecificSchema = await parseStream(
      openTestFileAsParsedTtlStream(),
      'sdCreation'
    );
    const defaultlyConvertedSchema = await parseStream(openTestFileAsParsedTtlStream(), 'default');
    const advancedSearchSpecificSchema = await parseStream(
      openTestFileAsParsedTtlStream(),
      'advancedSearch'
    );

    expect(defaultlyConvertedSchema.prefixes).toEqual(expectedPrefixes);
    expect(sdCreatorSpecificSchema.prefixes).toEqual(expectedPrefixes);
    expect(advancedSearchSpecificSchema.prefixes).toEqual(expectedPrefixes);
  });

  it('should handle visible, empty, and hidden sections according to UI schema type', async () => {
    const sdCreatorSpecificSchema = await parseStream(
      openTestFileAsParsedTtlStream(),
      'sdCreation'
    );
    const defaultlyConvertedSchema = await parseStream(openTestFileAsParsedTtlStream(), 'default');
    const advancedSearchSpecificSchema = await parseStream(
      openTestFileAsParsedTtlStream(),
      'advancedSearch'
    );

    const sdCreatorSections = sdCreatorSpecificSchema.root.SchemaConvertTestingShape.properties;
    const defaultSections = defaultlyConvertedSchema.root.SchemaConvertTestingShape.properties;
    const advancedSearchSections =
      advancedSearchSpecificSchema.root.SchemaConvertTestingShape.properties;

    expect(sdCreatorSections).toHaveProperty('simpl:visibleSection');
    expect(defaultSections).toHaveProperty('simpl:visibleSection');
    expect(advancedSearchSections).toHaveProperty('simpl:visibleSection');

    expect(sdCreatorSections).not.toHaveProperty('simpl:emptySection');
    expect(defaultSections).toHaveProperty('simpl:emptySection');
    expect(advancedSearchSections).not.toHaveProperty('simpl:emptySection');

    expect(sdCreatorSections).not.toHaveProperty('simpl:hiddenSection');
    expect(defaultSections).toHaveProperty('simpl:hiddenSection');
    expect(advancedSearchSections).toHaveProperty('simpl:hiddenSection');
  });

  it('should handle required properties according to UI schema type', async () => {
    const sdCreatorSpecificSchema = await parseStream(
      openTestFileAsParsedTtlStream(),
      'sdCreation'
    );
    const defaultlyConvertedSchema = await parseStream(openTestFileAsParsedTtlStream(), 'default');
    const advancedSearchSpecificSchema = await parseStream(
      openTestFileAsParsedTtlStream(),
      'advancedSearch'
    );

    const sdCreatorSections = sdCreatorSpecificSchema.root.SchemaConvertTestingShape.properties;
    const defaultSections = defaultlyConvertedSchema.root.SchemaConvertTestingShape.properties;
    const advancedSearchSections =
      advancedSearchSpecificSchema.root.SchemaConvertTestingShape.properties;

    const sdCreatorRequiredSections =
      sdCreatorSpecificSchema.root.SchemaConvertTestingShape.required;
    const defaultRequiredSections =
      defaultlyConvertedSchema.root.SchemaConvertTestingShape.required;
    const advancedSearchRequiredSections =
      advancedSearchSpecificSchema.root.SchemaConvertTestingShape.required;

    expect(advancedSearchRequiredSections).toBeUndefined();

    expect(sdCreatorSections!['simpl:visibleSection'].properties).toHaveProperty(
      'simpl:frontendOnlyRequiredProperty'
    );
    expect(defaultSections!['simpl:visibleSection'].properties).toHaveProperty(
      'simpl:frontendOnlyRequiredProperty'
    );

    expect(sdCreatorSections!['simpl:visibleSection'].required).toContain(
      'simpl:frontendOnlyRequiredProperty'
    );
    expect(defaultSections!['simpl:visibleSection'].required).not.toContain(
      'simpl:frontendOnlyRequiredProperty'
    );
    expect(advancedSearchSections!['simpl:visibleSection'].required).toBeUndefined();

    expect(sdCreatorRequiredSections).not.toContain('simpl:hiddenSection');
    expect(sdCreatorRequiredSections).not.toContain('simpl:emptySection');
    expect(defaultRequiredSections).toContain('simpl:hiddenSection');
    expect(defaultRequiredSections).toContain('simpl:emptySection');
  });
});
