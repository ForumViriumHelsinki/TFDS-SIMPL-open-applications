declare module '@rdfjs/tree' {
  import type { Quad } from '@rdfjs/types';
  import type TermMap from '@types/rdfjs__term-map';
  import type TermSet from '@types/rdfjs__term-set';

  export class Parser {
    constructor(tree: Tree);
    tree: Tree;
    listItems: TermMap;
    listItemsSeen: TermMap;
    listValues: TermSet;
    addQuad(quad: Quad): void;
    addQuads(quads: Quad[]): void;
    flush(): void;
    parse(quads: Quad[]): Tree;

    static parse(tree: Tree, quads: Quad[]): Tree;
  }

  export default class Tree {
    constructor(quads: Quad[]);
    nodes: TermMap;
    objects: TermMap;
    subjects: TermMap;
    parser: Parser;
  }

  export default Tree;
}

declare module '@rdfjs/formats-common' {
  import type { Stream } from '@rdfjs/types';

  type ImportFunction = (type: string, data: Readable) => Stream;

  type Parsers = {
    import: ImportFunction;
  };

  const parsers: Parsers;
}

import type { JSONSchema4 } from 'json-schema'

export type RDFJsonSchema = JSONSchema4 & {
  rdfType: string
}

export type SimplSDSchemaUIVariant = 'default' | 'sdCreation' | 'advancedSearch'

export type SimplConfigurePropertyValue =
  | 'hiddenInFrontend'
  | 'useForAdvancedSearch'
  | 'requiredOnFrontendOnly'

