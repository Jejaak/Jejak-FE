const configuredBaseUrl = import.meta.env.VITE_API_URL?.trim();

export const API_BASE_URL = (configuredBaseUrl || 'http://localhost:3000').replace(/\/$/u, '');

export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export function websocketUrl(path: string): string {
  const url = new URL(apiUrl(path));
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  return url.toString();
}
