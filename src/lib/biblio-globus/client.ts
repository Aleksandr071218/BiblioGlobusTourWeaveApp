'use server';

import type { BiblioGlobusCookie } from './auth';

let sessionCookie: BiblioGlobusCookie | null = null;
// TODO: Implement proper session management/caching for cookies.

/**
 * Creates a configured fetch function for making requests to the Biblio-Globus API.
 * It handles adding the necessary authentication cookies and gzip header.
 * 
 * @param cookie - The authentication cookie object.
 * @returns A fetch function pre-configured with necessary headers.
 */
export function createApiClient(cookie: BiblioGlobusCookie) {

  const cookieString = `A1=${cookie.A1}; Z1=${cookie.Z1}; L=${cookie.L}`;

  return async (url: string, options: RequestInit = {}): Promise<Response> => {
    const headers = new Headers(options.headers);
    headers.set('Cookie', cookieString);
    headers.set('Accept-Encoding', 'gzip');

    const response = await fetch(url, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        // TODO: Implement re-authentication logic here.
        throw new Error("Authentication required. The session may have expired.");
    }
    
    // The Z1 cookie can change on each request. We need to parse it and update our session.
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
        const z1Match = setCookieHeader.match(/Z1=([^;]+)/);
        if (z1Match && z1Match[1]) {
            cookie.Z1 = z1Match[1]; 
            // In a real app, this updated cookie object should be persisted in a cache (e.g., Redis, Firestore)
        }
    }

    return response;
  };
}
