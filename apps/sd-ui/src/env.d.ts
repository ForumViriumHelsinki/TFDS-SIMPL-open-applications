/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  PUBLIC_AUTH_KEYCLOAK_SERVER_URL: string;
  PUBLIC_AUTH_KEYCLOAK_REALM: string;
  PUBLIC_AUTH_KEYCLOAK_CLIENT_ID: string;
  PUBLIC_CREATION_WIZARD_API_URL: string;
  PUBLIC_CREATION_WIZARD_API_VERSION: string;
  PUBLIC_SIGNER_URL: string;
  PUBLIC_ASSET_ORCHESTRATOR_API_URL: string;
  PUBLIC_DEPLOYMENT_SCRIPT_UPLOAD_URL: string;
  USE_MOCK_IDENTITY_ATTRIBUTES?: string | boolean | number;
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
