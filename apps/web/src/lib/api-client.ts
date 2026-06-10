import type { AppType } from '@pokedex/api';
import { hc } from 'hono/client';

export function createApiClient(baseUrl: string) {
  return hc<AppType>(baseUrl);
}

const apiUrl = process.env.API_URL;
if (!apiUrl) {
  throw new Error('[api-client] API_URL is required');
}

export const serverApiClient = createApiClient(apiUrl);
