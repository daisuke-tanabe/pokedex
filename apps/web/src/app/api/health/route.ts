import { serverApiClient } from '@/lib/api-client';
import { errorEnvelope, successEnvelope } from '@/lib/envelope';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  try {
    // `serverApiClient.health` は Hono RPC の型推論上 optional になる (`.route('/', healthRoute)` の合成由来)。
    // ランタイムでは必ず存在するが、型上の防御として ?. と存在チェックで扱う。
    const upstream = await serverApiClient.health?.$get({});
    if (!upstream) {
      return Response.json(errorEnvelope('INTERNAL_ERROR', 'health route is not available on the upstream'), {
        status: 503,
      });
    }
    if (!upstream.ok) {
      return Response.json(errorEnvelope('INTERNAL_ERROR', `upstream returned ${upstream.status}`), { status: 503 });
    }
    return Response.json(successEnvelope({ status: 'ok' as const }), { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json(errorEnvelope('INTERNAL_ERROR', message), { status: 503 });
  }
}
