const TOKEN_KEY = 'gk_admin_token';

export const auth = {
  get token() {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string | null) {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* storage unavailable */
    }
  },
};

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

interface Options {
  method?: string;
  body?: unknown;
  form?: FormData;
  admin?: boolean;
}

async function raw(path: string, { method = 'GET', body, form, admin }: Options = {}) {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (admin && auth.token) headers.Authorization = `Bearer ${auth.token}`;

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: form ?? (body !== undefined ? JSON.stringify(body) : undefined),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const msg = Array.isArray(data.message) ? data.message.join('. ') : data.message;
    if (res.status === 401 && admin) {
      auth.set(null);
      if (!location.pathname.startsWith('/admin/login')) location.href = '/admin/login';
    }
    throw new ApiError(msg || `Request failed (${res.status})`, res.status);
  }
  return res;
}

export async function api<T>(path: string, options?: Options): Promise<T> {
  const res = await raw(path, options);
  return res.status === 204 ? (undefined as T) : res.json();
}

export async function apiBlob(path: string, admin = false) {
  const res = await raw(path, { admin });
  return res.blob();
}

/** Downloads a protected file through fetch so the auth header is sent. */
export async function downloadFile(path: string, fallbackName: string) {
  const res = await raw(path, { admin: true });
  const disposition = res.headers.get('content-disposition') ?? '';
  const name = /filename="([^"]+)"/.exec(disposition)?.[1] ?? fallbackName;
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export const errorMessage = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong');
