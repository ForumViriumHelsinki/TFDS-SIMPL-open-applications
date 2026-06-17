import { describe, it, expect } from 'vitest';
import { getPublicEnv } from '@/util/getEnv';

describe('getPublicEnv', () => {
  it('should return public window.envVars on client-side', () => {
    const mockEnvVars: PublicEnv = {
      PUBLIC_SEARCH_API_URL: 'https://api.example.com',
    } as unknown as PublicEnv;
    (global as any).window = { envVars: mockEnvVars };

    const result = getPublicEnv();

    expect(result).toEqual(mockEnvVars);
  });

  it('should return process.env variables starting with PUBLIC_ on server-side', () => {
    delete (global as any).window;
    process.env = {
      PUBLIC_API_URL: 'https://api.example.com',
      PRIVATE_API_URL: 'https://api.example.com',
      RANDOM_VAR: 'random',
    } as unknown as NodeJS.ProcessEnv;

    const result = getPublicEnv();

    expect(result).toEqual({ PUBLIC_API_URL: 'https://api.example.com' });
  });

  it('should return an empty object if no PUBLIC_ variables are set on server-side', () => {
    delete (global as any).window;
    process.env = {
      PRIVATE_KEY: 'abc123',
      RANDOM_VAR: 'random',
    } as unknown as NodeJS.ProcessEnv;

    const result = getPublicEnv();

    expect(result).toEqual({});
  });
});
