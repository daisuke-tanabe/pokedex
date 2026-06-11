import type { Envelope, ErrorCode } from '@pokedex/contracts';

type SuccessEnvelope<TData, TMeta = unknown> = Extract<Envelope<TData, TMeta>, { success: true }>;
type ErrorEnvelope = Extract<Envelope<unknown>, { success: false }>;

/**
 * 成功エンベロープを生成する。
 *
 * `meta` を省略した場合は data のみを持つエンベロープを返し、`meta` を渡すと
 * `{ success: true, data, meta }` を返す (apps/api 側 envelope.ts と同じ overload 設計)。
 * 一覧 API の `nextCursor` などをテストで透過させるため overload を提供する。
 */
export function successEnvelope<TData>(data: TData): SuccessEnvelope<TData>;
export function successEnvelope<TData, TMeta>(data: TData, meta: TMeta): SuccessEnvelope<TData, TMeta>;
export function successEnvelope<TData, TMeta>(data: TData, meta?: TMeta): SuccessEnvelope<TData, TMeta> {
  if (meta === undefined) {
    return { success: true, data } as SuccessEnvelope<TData, TMeta>;
  }
  return { success: true, data, meta };
}

export function errorEnvelope(code: ErrorCode, message: string): ErrorEnvelope {
  return { success: false, error: { code, message } };
}
