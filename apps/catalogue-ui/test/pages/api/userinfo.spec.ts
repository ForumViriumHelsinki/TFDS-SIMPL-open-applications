import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/pages/api/userinfo';

describe('userinfo API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockCookies = (tokenValue?: string) => ({
    get: vi.fn((name: string) => {
      if (name === 'token' && tokenValue) {
        return { value: tokenValue };
      }
      return undefined;
    }),
  });

  const createValidJWT = (payload: any) => {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const encodedPayload = btoa(JSON.stringify(payload));
    const signature = 'mock-signature';
    return `${header}.${encodedPayload}.${signature}`;
  };

  it('returns 401 when no token cookie is present', async () => {
    const mockCookies = createMockCookies();
    const response = await GET({ cookies: mockCookies } as any);

    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data).toEqual({
      firstName: undefined,
      lastName: undefined,
      error: 'Authorization token not found, please login',
    });
  });

  it('returns 401 when token is invalid (not 3 parts)', async () => {
    const mockCookies = createMockCookies('invalid.token');
    const response = await GET({ cookies: mockCookies } as any);

    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data).toEqual({
      firstName: undefined,
      lastName: undefined,
      error: 'Invalid token',
    });
  });

  it('returns 401 when token cannot be decoded', async () => {
    const mockCookies = createMockCookies('invalid.invalid.invalid');
    const response = await GET({ cookies: mockCookies } as any);

    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data).toEqual({
      firstName: undefined,
      lastName: undefined,
      error: 'Invalid token',
    });
  });

  it('returns user info with firstName and lastName from JWT', async () => {
    const payload = {
      given_name: 'John',
      family_name: 'Doe',
      name: 'John Doe',
      preferred_username: 'johndoe',
      email: 'john.doe@example.com',
    };
    const token = createValidJWT(payload);
    const mockCookies = createMockCookies(token);

    const response = await GET({ cookies: mockCookies } as any);

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toEqual({
      firstName: 'John',
      lastName: 'Doe',
      name: 'John Doe',
      username: 'johndoe',
      email: 'john.doe@example.com',
    });
  });

  it('returns default values when given_name and family_name are missing', async () => {
    const payload = {
      preferred_username: 'johndoe',
      email: 'john.doe@example.com',
    };
    const token = createValidJWT(payload);
    const mockCookies = createMockCookies(token);

    const response = await GET({ cookies: mockCookies } as any);

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toEqual({
      firstName: 'User',
      lastName: 'Name',
      name: '',
      username: 'johndoe',
      email: 'john.doe@example.com',
    });
  });

  it('returns default values when given_name and family_name are empty strings', async () => {
    const payload = {
      given_name: '',
      family_name: '',
      email: 'user@example.com',
    };
    const token = createValidJWT(payload);
    const mockCookies = createMockCookies(token);

    const response = await GET({ cookies: mockCookies } as any);

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toEqual({
      firstName: 'User',
      lastName: 'Name',
      name: '',
      username: '',
      email: 'user@example.com',
    });
  });

  it('returns empty strings for missing optional fields', async () => {
    const payload = {
      given_name: 'Jane',
      family_name: 'Smith',
    };
    const token = createValidJWT(payload);
    const mockCookies = createMockCookies(token);

    const response = await GET({ cookies: mockCookies } as any);

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toEqual({
      firstName: 'Jane',
      lastName: 'Smith',
      name: '',
      username: '',
      email: '',
    });
  });

  it('returns correct Content-Type header', async () => {
    const payload = {
      given_name: 'John',
      family_name: 'Doe',
    };
    const token = createValidJWT(payload);
    const mockCookies = createMockCookies(token);

    const response = await GET({ cookies: mockCookies } as any);

    expect(response.headers.get('Content-Type')).toBe('application/json');
  });

  it('handles JWT with URL-safe base64 encoding', async () => {
    const payload = {
      given_name: 'Test',
      family_name: 'User',
    };
    // Create token with URL-safe base64 (- and _ instead of + and /)
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
    const encodedPayload = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_');
    const signature = 'mock-signature';
    const token = `${header}.${encodedPayload}.${signature}`;

    const mockCookies = createMockCookies(token);

    const response = await GET({ cookies: mockCookies } as any);

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.firstName).toBe('Test');
    expect(data.lastName).toBe('User');
  });
});
