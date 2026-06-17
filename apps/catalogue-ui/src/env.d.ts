/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_AUTH_KEYCLOAK_SERVER_URL: string;
  readonly PUBLIC_AUTH_KEYCLOAK_REALM: string;
  readonly PUBLIC_AUTH_KEYCLOAK_CLIENT_ID: string;
  readonly PUBLIC_SEARCH_API_URL: string;
  readonly PUBLIC_SEARCH_API_VERSION?: string;
  readonly PUBLIC_QUERY_MAPPER_ADAPTER_API_URL?: string;
  readonly PUBLIC_QUERY_MAPPER_ADAPTER_API_VERSION?: string;
  readonly PUBLIC_FEDERATED_CATALOGUE_API_URL?: string;
  readonly PUBLIC_FEDERATED_CATALOGUE_API_VERSION?: string;
  readonly PUBLIC_CONTRACT_CONSUMPTION_API_URL: string;
  readonly PUBLIC_CONTRACT_CONSUMPTION_API_VERSION?: string;
  readonly PUBLIC_AGENT_TYPE: AgentType;

  // more env variables...
}

// New type for public environment variables
type PublicEnv = {
  [K in keyof ImportMetaEnv as K extends `PUBLIC_${string}` ? K : never]: ImportMetaEnv[K];
};

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Augment the Window interface
interface Window {
  envVars: PublicEnv;
}
declare namespace NodeJS {
  interface ProcessEnv extends ImportMetaEnv {}
}

type AgentType = 'consumer' | 'provider';
