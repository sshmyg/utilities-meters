const CSRF_COOKIE_PATH = '/sanctum/csrf-cookie';

const extractCookieValue = (cookies: string[], name: string) => {
  const prefix = `${name}=`;
  const cookie = cookies.find((entry) => entry.startsWith(prefix));

  if (!cookie) {
    return;
  }

  const semicolonIndex = cookie.indexOf(';');
  const valuePart = semicolonIndex === -1 ? cookie : cookie.slice(0, semicolonIndex);
  const rawValue = valuePart.slice(prefix.length);

  return decodeURIComponent(rawValue);
};

export const getSanctumSession = async (baseUrl: string) => {
  const res = await fetch(`${baseUrl}${CSRF_COOKIE_PATH}`, {
    headers: { 'user-agent': 'Mozilla/5.0', accept: 'application/json' },
  });

  console.log('SANCTUM SESSION status:', res.status, '| url:', res.url);

  const cookies = res.headers.getSetCookie?.() ?? [];
  const cookie = cookies.map((entry) => entry.split(';')[0]).join('; ');

  console.log('SANCTUM SESSION cookies:', cookies);

  const xsrfToken = extractCookieValue(cookies, 'XSRF-TOKEN');

  if (!xsrfToken) {
    throw new Error('XSRF-TOKEN cookie not found');
  }

  return {
    cookie,
    xsrfToken,
  };
};

export type SanctumSession = Awaited<ReturnType<typeof getSanctumSession>>;
