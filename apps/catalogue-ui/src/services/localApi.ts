export const getToken = async (): Promise<{ token: string | undefined; error?: string }> => {
  try {
    const response = await fetch('/api/token', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();

    return data;
  } catch (err) {
    return { token: undefined, error: (err as Error)?.message ?? 'Unknown error' };
  }
};
