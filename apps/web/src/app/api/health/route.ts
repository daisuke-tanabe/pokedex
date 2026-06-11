import { serverApiClient } from '@/lib/api-client.server';
import { errorEnvelope, successEnvelope } from '@/lib/envelope';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  try {
    // `serverApiClient.health` は Hono RPC の型推論上 optional になる (`.route('/', healthRoute)` の合成由来)。
    // ランタイムでは必ず存在するが、型上の防御として ?. と存在チェックで扱う。
    const upstream = await serverApiClient.health?.$get({});
    if (!upstream) {
      console.error('[health] upstream client missing health route');
      return Response.json(errorEnvelope('INTERNAL_ERROR', 'upstream health check failed'), { status: 503 });
    }
    // body 未消費だと Node.js (undici) のコネクションプールが GC のファイナライザ経由で遅延クリーンアップ
    // されるため、高頻度コール (監視ツール等) を想定して明示的に消費する。`.text()` は jsdom + MSW v2 でも
    // 安定動作 (`body.cancel()` は jsdom の ReadableStream 実装で hang する)。
    await upstream.text();
    if (!upstream.ok) {
      console.error('[health] upstream returned non-ok status', upstream.status);
      return Response.json(errorEnvelope('INTERNAL_ERROR', 'upstream health check failed'), { status: 503 });
    }
    return Response.json(successEnvelope({ status: 'ok' as const }), { status: 200 });
  } catch (error) {
    // 内部 IP / ホスト / URL が `error.message` に乗ることがあるため、レスポンスには汎用 message のみ返し、
    // 詳細はサーバ側ログに残す。
    console.error('[health] upstream request failed', error);
    return Response.json(errorEnvelope('INTERNAL_ERROR', 'upstream health check failed'), { status: 503 });
  }
}
