'use server';

import { z } from 'zod';

const AuthResponseHeadersSchema = z.object({
  'set-cookie': z.array(z.string()),
});

const CookieSchema = z.object({
  A1: z.string(),
  Z1: z.string(),
  L: z.string(),
});

export type BiblioGlobusCookie = z.infer<typeof CookieSchema>;

/**
 * Parses cookies from the 'set-cookie' headers of a fetch response.
 * @param headers - The response headers.
 * @returns An object containing the required cookies.
 * @throws If any of the required cookies (A1, Z1, L) are missing.
 */
function parseCookies(headers: Headers): BiblioGlobusCookie {
  const parsedHeaders = AuthResponseHeadersSchema.safeParse({
    'set-cookie': headers.getSetCookie(),
  });

  if (!parsedHeaders.success) {
    throw new Error('Failed to parse set-cookie headers.');
  }

  const cookies: { [key: string]: string } = {};
  parsedHeaders.data['set-cookie'].forEach((cookieString) => {
    const parts = cookieString.split(';')[0].split('=');
    if (parts.length === 2) {
      cookies[parts[0]] = parts[1];
    }
  });

  const result = CookieSchema.safeParse(cookies);

  if (!result.success) {
    console.error('Missing required cookies in authentication response.', result.error);
    throw new Error('Authentication failed: missing required cookies (A1, Z1, L).');
  }

  return result.data;
}


/**
 * Authenticates with the Biblio-Globus API and returns session cookies.
 * This function should be called once to get the initial cookies.
 * The Z1 cookie needs to be updated with each subsequent request.
 * @returns A promise that resolves to the session cookies.
 * @throws If login or password are not set in environment variables or if authentication fails.
 */
export async function authenticate(): Promise<BiblioGlobusCookie> {
  const login = process.env.BIBLIO_GLOBus_LOGIN;
  const password = process.env.BIBLIO_GLOBUS_PASSWORD;

  if (!login || !password) {
    throw new Error('BIBLIO_GLOBUS_LOGIN and BIBLIO_GLOBUS_PASSWORD must be set in .env');
  }

  const body = new URLSearchParams();
  body.append('login', login);
  body.append('pwd', password);

  try {
    const response = await fetch('https://login.bgoperator.ru/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
        console.error(`Authentication failed with status: ${response.status} ${response.statusText}`);
        const text = await response.text();
        console.error(`Response body: ${text}`);
        throw new Error(`Authentication request failed: ${response.statusText}`);
    }

    return parseCookies(response.headers);
  } catch (error) {
    console.error('An error occurred during authentication:', error);
    throw new Error('Failed to authenticate with Biblio-Globus API.');
  }
}
