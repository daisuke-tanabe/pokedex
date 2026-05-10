import type { Envelope, ErrorCode } from '@pokedex/contracts';

/**
 * 成功エンベロープを生成する。
 *
 * `meta` を省略した場合は data のみを持つエンベロープを返す
 * (`exactOptionalPropertyTypes: true` への配慮)。
 */
export function successEnvelope<TData>(data: TData): Envelope<TData>;
export function successEnvelope<TData>(
  data: TData,
  meta: { total: number; page: number; limit: number },
): Envelope<TData>;
export function successEnvelope<TData>(
  data: TData,
  meta?: { total: number; page: number; limit: number },
): Envelope<TData> {
  if (meta === undefined) {
    return { success: true, data };
  }
  return { success: true, data, meta };
}

/**
 * 失敗エンベロープを生成する。
 *
 * `code` は `ErrorCode` ユニオン型に制約され、未定義のコードは型エラーになる。
 */
export function errorEnvelope<TData = never>(code: ErrorCode, message: string): Envelope<TData> {
  return { success: false, error: { code, message } };
}
