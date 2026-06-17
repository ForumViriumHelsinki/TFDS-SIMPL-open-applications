import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ cookies }) => {
  const token = cookies.get('token')?.value;
  if (token) {
    return new Response(JSON.stringify({ token }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } else {
    return new Response(
      JSON.stringify({ token: undefined, error: 'Authorization token not found, please login' }),
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};
