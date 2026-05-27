import type { AppType } from '@pokedex/api';
import { hc } from 'hono/client';

const DEFAULT_API_URL = 'http://localhost:3000';

export function createApiClient(baseUrl: string) {
  return hc<AppType>(baseUrl);
}

export const serverApiClient = createApiClient(process.env.API_URL ?? DEFAULT_API_URL);
