export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://finanfamily-api.onrender.com';

export function getAuthHeaders(): Record<string, string> {
  const token = typeof window === 'undefined'
    ? null
    : localStorage.getItem('@FinanFamily:token');
  if (!token) {
    throw new Error('Sua sessão expirou. Entre novamente para continuar.');
  }
  return { Authorization: `Bearer ${token}` };
}

export function getJsonAuthHeaders(): Record<string, string> {
  return {
    ...getAuthHeaders(),
    'Content-Type': 'application/json',
  };
}

export function authenticatedFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const authHeaders = getAuthHeaders();
  headers.set('Authorization', authHeaders.Authorization);
  return fetch(input, { ...init, headers });
}
