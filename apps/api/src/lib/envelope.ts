import type { Envelope, ErrorCode } from '@pokedex/contracts';

/**
 * 成功エンベロープを生成する。
 *
 * `meta` を省略した場合は data のみを持つエンベロープを返す
 * (`exactOptionalPropertyTypes: true` への配慮)。
 * `meta` の型は呼び出し側で自由に決められる (cursor pagination / page meta どちらにも対応)。
 */
export function successEnvelope<TData>(data: TData): Envelope<TData>;
export function successEnvelope<TData, TMeta>(data: TData, meta: TMeta): Envelope<TData, TMeta>;
export function successEnvelope<TData, TMeta>(data: TData, meta?: TMeta): Envelope<TData, TMeta> {
  if (meta === undefined) {
    return { success: true, data };
  }
  return { success: true, data, meta };
}

/**
 * 失敗側のエンベロープ型。`Envelope<T>` から `success: false` ブランチだけを抽出する。
 */
type ErrorEnvelope = Extract<Envelope<unknown>, { success: false }>;

/**
 * 失敗エンベロープを生成する。
 *
 * `code` は `ErrorCode` ユニオン型に制約され、未定義のコードは型エラーになる。
 * 返り値は失敗ブランチに限定された型なので、呼び出し側で `success: true` の
 * 到達不能 union を扱う必要がない。
 */
export function errorEnvelope(code: ErrorCode, message: string): ErrorEnvelope {
  return { success: false, error: { code, message } };
}
