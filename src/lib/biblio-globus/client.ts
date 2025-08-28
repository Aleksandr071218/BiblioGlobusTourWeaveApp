'use server';

import type { BiblioGlobusCookie } from './auth';

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

    // Use Next.js revalidation strategy for caching
    const response = await fetch(url, {
        ...options,
        headers,
        next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (response.status === 401) {
        // TODO: Implement re-authentication logic here.
        // For now, we rely on the cache not expiring for the lifetime of a user session
        console.error("Biblio-Globus API authentication failed (401). The cookie might be invalid or expired.");
        throw new Error("Authentication required. The session may have expired.");
    }
    
    // The Z1 cookie can change on each request. We need to parse it and update our session.
    // NOTE: This simple implementation won't persist the updated Z1 cookie across different server actions.
    // A more robust solution would use a shared cache (like Redis or Firestore) for the cookie object.
    const setCookieHeader = response.headers.get('set-cookie');
    if (setCookieHeader) {
        const z1Match = setCookieHeader.match(/Z1=([^;]+)/);
        if (z1Match && z1Match[1]) {
            cookie.Z1 = z1Match[1]; 
        }
    }

    return response;
  };
}
