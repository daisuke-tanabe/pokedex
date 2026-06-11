import { errorEnvelope } from '@/lib/envelope';

/**
 * `GET /pokemon` の Next.js Route Handler proxy。
 *
 * Client 側 (`useInfiniteQuery`) は `createApiClient('').api.pokemon.$get({ query })` で
 * 相対パス `/api/pokemon` を叩く。これが本 Route Handler に届くため、ここから
 * `process.env.API_URL` 経由で実 Hono API (`/api/pokemon`) に thin proxy する。
 *
 * これにより `NEXT_PUBLIC_API_URL` をブラウザに露出させずに済む
 * (`web-foundation` の Requirement「`NEXT_PUBLIC_API_URL` は導入しない」を維持)。
 */
const apiUrl = process.env.API_URL;
if (apiUrl === undefined) {
  throw new Error('[api/pokemon] API_URL is required');
}

export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<Response> {
  try {
    const incomingUrl = new URL(request.url);
    const upstream = await fetch(`${apiUrl}/api/pokemon${incomingUrl.search}`);
    // body を消費しないと undici のコネクションプールが GC まで遅延クリーンアップされる
    // (api/health/route.ts と同方針)。
    const body = await upstream.text();
    return new Response(body, {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    // 内部 IP / ホストが error.message に乗りうるため、レスポンスは汎用 message のみ。
    console.error('[api/pokemon] upstream request failed', error);
    return Response.json(errorEnvelope('INTERNAL_ERROR', 'upstream pokemon request failed'), { status: 503 });
  }
}
