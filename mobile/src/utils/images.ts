import { API_URL, COLORS } from '../constants/theme';

const BASE_URL = API_URL.replace(/\/api\/?$/, '');

export function resolveImageUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
