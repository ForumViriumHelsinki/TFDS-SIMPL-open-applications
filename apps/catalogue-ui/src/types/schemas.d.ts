export interface SchemaMetadata {
  id: string;
  title: string;
  name: string;
  description: string;
  resourceType: string;
  version: string;
}

export interface SchemasResponse {
  schemas: SchemaMetadata[];
}
