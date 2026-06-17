import type { APIRoute } from 'astro';

interface JWTPayload {
  given_name?: string;
  family_name?: string;
  name?: string;
  preferred_username?: string;
  email?: string;
  [key: string]: unknown;
}

const decodeJWT = (token: string): JWTPayload | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = parts[1];
    let base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const decoded = atob(base64);
    return JSON.parse(decoded);
  } catch (err) {
    console.error('Failed to decode JWT:', err);
    return null;
  }
};

export const GET: APIRoute = async ({ cookies }) => {
  const token = cookies.get('token')?.value;

  if (!token) {
    return new Response(
      JSON.stringify({
        firstName: undefined,
        lastName: undefined,
        error: 'Authorization token not found, please login',
      }),
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  const payload = decodeJWT(token);

  if (!payload) {
    return new Response(
      JSON.stringify({
        firstName: undefined,
        lastName: undefined,
        error: 'Invalid token',
      }),
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  return new Response(
    JSON.stringify({
      firstName: payload.given_name || 'User',
      lastName: payload.family_name || 'Name',
      name: payload.name || '',
      username: payload.preferred_username || '',
      email: payload.email || '',
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
};
