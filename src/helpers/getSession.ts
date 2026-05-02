export const getSession = async (url: string) => {
  const res = await fetch(url, {
    headers: { 'user-agent': 'Mozilla/5.0' },
  });

  const html = await res.text();

  const cookies = res.headers.getSetCookie?.() ?? [];
  const cookie = cookies.map((c) => c.split(';')[0]).join('; ');
  const csrfMatch =
    html.match(/<meta name="csrf-token" content="([^"]+)"/) || html.match(/name="csrf-token"\s+content="([^"]+)"/);

  const csrfToken = csrfMatch?.[1];

  if (!csrfToken) {
    throw new Error('CSRF not found');
  }

  return {
    csrfToken,
    cookie,
  };
};

export type GetSessionResult = Awaited<ReturnType<typeof getSession>>;
