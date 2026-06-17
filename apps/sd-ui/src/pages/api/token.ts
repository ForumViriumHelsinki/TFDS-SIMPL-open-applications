import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request, cookies }) => {
  const token = cookies.get('token')?.value;

  if (!token) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/login?redirect=' + encodeURIComponent(request.url),
      },
    });
  }

  return new Response(token, {
    status: 200,
  });
};
