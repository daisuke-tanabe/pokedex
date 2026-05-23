/* oxlint-disable typescript/no-unnecessary-type-parameters --
 * valibot のスキーマ生成関数では `TSchema` を介して `data` の型を呼び出し側に
 * 伝播させているため、型パラメータの除去は型情報の損失につながる。
 * 戻り値型を明示する方法もあるが valibot の内部型は不安定なため disable で対処する。
 */
import * as v from 'valibot';

import { ErrorCode } from '../errors.js';

/**
 * 成功エンベロープのスキーマ生成。
 *
 * `data` の型は引数で受け取った Valibot スキーマで決定される。
 * `meta` は省略時 `unknown` を許容し、明示すると渡したスキーマで検証する。
 *
 * `strictObject` で余分なプロパティを許容しないため、`success: true` と `error`
 * が両立するような不正値は variant 経由でも弾かれる。
 */
export const successEnvelopeSchema = <
  const TSchema extends v.GenericSchema,
  const TMetaSchema extends v.GenericSchema = v.UnknownSchema,
>(
  dataSchema: TSchema,
  metaSchema?: TMetaSchema,
) =>
  v.strictObject({
    success: v.literal(true),
    data: dataSchema,
    meta: v.optional(metaSchema ?? v.unknown()),
  });

/**
 * 失敗エンベロープのスキーマ。
 *
 * `error.code` は `ErrorCode` の値集合に制約される。
 */
export const errorEnvelopeSchema = v.strictObject({
  success: v.literal(false),
  error: v.strictObject({
    code: v.picklist(Object.values(ErrorCode) as readonly ErrorCode[]),
    message: v.string(),
  }),
});

/**
 * エンベロープスキーマ生成関数。
 *
 * `success` フィールドを判別子とする variant (判別可能ユニオン) として、
 * 成功型と失敗型のいずれか一方を表現する。`metaSchema` を省略した場合は
 * `meta?: unknown` として扱い、明示した場合はそのスキーマで `meta` を検証する。
 */
export const envelopeSchema = <
  const TSchema extends v.GenericSchema,
  const TMetaSchema extends v.GenericSchema = v.UnknownSchema,
>(
  dataSchema: TSchema,
  metaSchema?: TMetaSchema,
) => v.variant('success', [successEnvelopeSchema(dataSchema, metaSchema), errorEnvelopeSchema]);

/**
 * エンベロープ型のヘルパ。`v.InferOutput<ReturnType<typeof envelopeSchema>>` の代替。
 *
 * `TMeta` を省略した場合は `unknown` として扱い、メタの構造を呼び出し側に強制しない。
 */
export type Envelope<TData, TMeta = unknown> =
  | {
      success: true;
      data: TData;
      meta?: TMeta;
    }
  | {
      success: false;
      error: { code: ErrorCode; message: string };
    };
