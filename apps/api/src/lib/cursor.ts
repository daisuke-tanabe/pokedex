import * as v from 'valibot';

/**
 * Cursor の内部ペイロード。
 *
 * `pn` = `pokedex_entries.pokedex_number`、`fid` = `forms.id`。
 * `(pokedex_number, form_id)` の複合キーで seek pagination の安定ソートを担保する
 * (同一 pokedex_number に複数 form がぶら下がるため、`pokedex_number` 単独では
 * 並びが decided にならない)。
 *
 * `version` フィールドは持たない (YAGNI)。破壊的変更が必要になったら別 change で扱う。
 */
export interface CursorPayload {
  readonly pn: number;
  readonly fid: number;
}

const cursorPayloadSchema = v.object({
  pn: v.pipe(v.number(), v.integer(), v.minValue(0)),
  fid: v.pipe(v.number(), v.integer(), v.minValue(0)),
});

const base64UrlPattern = /^[A-Za-z0-9_-]+$/u;

/**
 * Node の `Buffer` を経由して base64url エンコードする (パディングなし)。
 *
 * Web 標準の `btoa` は ASCII しか受け付けないが、ここで扱うのは JSON 化された
 * 数値のみなので Node 環境では `Buffer.from(...).toString('base64url')` が最短。
 */
const toBase64Url = (input: string): string => Buffer.from(input, 'utf8').toString('base64url');

const fromBase64Url = (input: string): string => Buffer.from(input, 'base64url').toString('utf8');

/**
 * `(pokedex_number, form_id)` ペアを opaque な base64url 文字列にエンコードする。
 */
export const encodeCursor = (payload: CursorPayload): string => {
  const validated = v.parse(cursorPayloadSchema, payload);
  return toBase64Url(JSON.stringify(validated));
};

/**
 * base64url 文字列を `(pokedex_number, form_id)` ペアにデコードする。
 *
 * 不正な base64url 文字列、JSON パース失敗、payload スキーマ違反のいずれでも
 * `null` を返す (route 層で `INVALID_QUERY` (400) に詰め直す責務に統一)。
 */
export const decodeCursor = (token: string): CursorPayload | null => {
  if (!base64UrlPattern.test(token)) {
    return null;
  }

  let decoded: unknown;
  try {
    decoded = JSON.parse(fromBase64Url(token));
  } catch {
    return null;
  }

  const result = v.safeParse(cursorPayloadSchema, decoded);
  return result.success ? result.output : null;
};
