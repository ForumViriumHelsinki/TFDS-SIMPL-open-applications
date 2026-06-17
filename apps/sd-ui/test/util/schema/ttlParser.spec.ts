import { describe, it, expect } from 'vitest';
import { parseStream } from '@/util/ttlParser/ttlParser';
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

  it('should handle properties without sh:name', async () => {
    const minimalTtl = `
      @prefix sh: <http://www.w3.org/ns/shacl#> .
      @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
      @prefix simpl: <http://w3id.org/gaia-x/simpl#> .

      simpl:MinimalShape a sh:NodeShape ;
        sh:targetClass simpl:MinimalClass ;
        sh:property [
          sh:path simpl:propertyWithoutName ;
          sh:datatype xsd:string ;
        ] .
    `;

    const ttlStream = Readable.from(minimalTtl);
    const parsedStream = formats.parsers.import('text/turtle', ttlStream);

    const { root } = await parseStream(parsedStream!, 'default');

    expect(root.MinimalShape.properties).toBeDefined();
    expect(root.MinimalShape.properties).toHaveProperty('simpl:propertyWithoutName');
    expect(root.MinimalShape.properties!['simpl:propertyWithoutName'].title).toBeUndefined();
  });

  it('should handle properties without sh:description', async () => {
    const minimalTtl = `
      @prefix sh: <http://www.w3.org/ns/shacl#> .
      @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
      @prefix simpl: <http://w3id.org/gaia-x/simpl#> .

      simpl:MinimalShape a sh:NodeShape ;
        sh:targetClass simpl:MinimalClass ;
        sh:property [
          sh:path simpl:propertyWithoutDescription ;
          sh:datatype xsd:string ;
        ] .
    `;

    const ttlStream = Readable.from(minimalTtl);
    const parsedStream = formats.parsers.import('text/turtle', ttlStream);

    const { root } = await parseStream(parsedStream!, 'default');

    expect(root.MinimalShape.properties).toBeDefined();
    expect(root.MinimalShape.properties).toHaveProperty('simpl:propertyWithoutDescription');
    expect(
      root.MinimalShape.properties!['simpl:propertyWithoutDescription'].description
    ).toBeUndefined();
  });

  it('should keep hiddenInFrontend properties on AssetPropertiesShape in sdCreation mode', async () => {
    const ttl = `
      @prefix sh: <http://www.w3.org/ns/shacl#> .
      @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
      @prefix simpl: <http://w3id.org/gaia-x/simpl#> .

      simpl:ParentShape a sh:NodeShape ;
        sh:targetClass simpl:ParentClass ;
        sh:property [
          sh:path simpl:assetProperties ;
          sh:node simpl:AssetPropertiesShape ;
        ] .

      simpl:AssetPropertiesShape a sh:NodeShape ;
        sh:targetClass simpl:AssetProperties ;
        sh:property [
          simpl:configure ( "hiddenInFrontend" ) ;
          sh:path simpl:hiddenProp ;
          sh:datatype xsd:string ;
        ] .
    `;

    const parsedStream = formats.parsers.import('text/turtle', Readable.from(ttl));
    const { root } = await parseStream(parsedStream!, 'sdCreation');

    // On a regular shape, hiddenInFrontend properties are removed in sdCreation mode.
    // AssetPropertiesShape is the exception: its properties must always be present.
    const assetProps = root.ParentShape?.properties?.['simpl:assetProperties'];
    expect(assetProps).toBeDefined();
    expect(assetProps?.properties).toHaveProperty('simpl:hiddenProp');
  });

  it('should keep hiddenInFrontend properties on AssetPropertiesShape in default mode', async () => {
    const ttl = `
      @prefix sh: <http://www.w3.org/ns/shacl#> .
      @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
      @prefix simpl: <http://w3id.org/gaia-x/simpl#> .

      simpl:ParentShape a sh:NodeShape ;
        sh:targetClass simpl:ParentClass ;
        sh:property [
          sh:path simpl:assetProperties ;
          sh:node simpl:AssetPropertiesShape ;
        ] .

      simpl:AssetPropertiesShape a sh:NodeShape ;
        sh:targetClass simpl:AssetProperties ;
        sh:property [
          simpl:configure ( "hiddenInFrontend" ) ;
          sh:path simpl:hiddenProp ;
          sh:datatype xsd:string ;
        ] .
    `;

    const parsedStream = formats.parsers.import('text/turtle', Readable.from(ttl));
    const { root } = await parseStream(parsedStream!, 'default');

    // In default mode, hiddenInFrontend has no effect — the property should still appear.
    const assetProps = root.ParentShape?.properties?.['simpl:assetProperties'];
    expect(assetProps).toBeDefined();
    expect(assetProps?.properties).toHaveProperty('simpl:hiddenProp');
  });

  it('should NOT remove AssetPropertiesShape node even when it has no properties', async () => {
    const ttl = `
      @prefix sh: <http://www.w3.org/ns/shacl#> .
      @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
      @prefix simpl: <http://w3id.org/gaia-x/simpl#> .

      simpl:ParentShape a sh:NodeShape ;
        sh:targetClass simpl:ParentClass ;
        sh:property [
          sh:path simpl:assetProperties ;
          sh:node simpl:AssetPropertiesShape ;
        ] .

      simpl:AssetPropertiesShape a sh:NodeShape ;
        sh:targetClass simpl:AssetProperties .
    `;

    const parsedStream = formats.parsers.import('text/turtle', Readable.from(ttl));
    const { root } = await parseStream(parsedStream!, 'default');

    // A normal node with empty properties would be deleted by deleteNodesWithEmptyProperties.
    // AssetPropertiesShape (rdfType: simpl:AssetProperties) is the exception and must be preserved.
    const assetProps = root.ParentShape?.properties?.['simpl:assetProperties'];
    expect(assetProps).toBeDefined();
    expect(assetProps?.properties).toEqual({});
  });

  it('should remove a regular node that ends up with empty properties', async () => {
    const ttl = `
      @prefix sh: <http://www.w3.org/ns/shacl#> .
      @prefix xsd: <http://www.w3.org/2001/XMLSchema#> .
      @prefix simpl: <http://w3id.org/gaia-x/simpl#> .

      simpl:ParentShape a sh:NodeShape ;
        sh:targetClass simpl:ParentClass ;
        sh:property [
          sh:path simpl:regularSection ;
          sh:node simpl:RegularSectionShape ;
        ] .

      simpl:RegularSectionShape a sh:NodeShape ;
        sh:targetClass simpl:RegularSection .
    `;

    const parsedStream = formats.parsers.import('text/turtle', Readable.from(ttl));
    const { root } = await parseStream(parsedStream!, 'default');

    // Regular nodes with no properties are cleaned up by deleteNodesWithEmptyProperties.
    expect(root.ParentShape?.properties?.['simpl:regularSection']).toBeUndefined();
  });
});
