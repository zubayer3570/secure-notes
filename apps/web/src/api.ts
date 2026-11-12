const TOKEN_KEY = 'token';

let token = localStorage.getItem(TOKEN_KEY);
let handleUnauthorized = () => {};

export type Query = Record<string, string | null | undefined>;

export const hasToken = () => token !== null;

export function setToken(value: string | null) {
  token = value;
  if (value) localStorage.setItem(TOKEN_KEY, value);
  else localStorage.removeItem(TOKEN_KEY);
}

export function onUnauthorized(handler: () => void) {
  handleUnauthorized = handler;
}

export function withQuery(path: string, params: Query) {
  const entries = Object.entries(params).filter((entry): entry is [string, string] => entry[1] != null);
  if (!entries.length) return path;
  return `${path}${path.includes('?') ? '&' : '?'}${new URLSearchParams(entries)}`;
}

export async function api<T = null>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (token) headers.authorization = `Bearer ${token}`;
  const res = await fetch(`/api${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  if (res.status === 401 && token) handleUnauthorized();
  if (res.status === 204) return null as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
  return data;
}
