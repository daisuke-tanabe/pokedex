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
 * `meta` はページネーションメタデータ用のオプショナル。
 *
 * `strictObject` で余分なプロパティを許容しないため、`success: true` と `error`
 * が両立するような不正値は variant 経由でも弾かれる。
 */
export const successEnvelopeSchema = <const TSchema extends v.GenericSchema>(dataSchema: TSchema) =>
  v.strictObject({
    success: v.literal(true),
    data: dataSchema,
    meta: v.optional(
      v.object({
        total: v.number(),
        page: v.number(),
        limit: v.number(),
      }),
    ),
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
 * 成功型と失敗型のいずれか一方を表現する。
 */
export const envelopeSchema = <const TSchema extends v.GenericSchema>(dataSchema: TSchema) =>
  v.variant('success', [successEnvelopeSchema(dataSchema), errorEnvelopeSchema]);

/**
 * エンベロープ型のヘルパ。`v.InferOutput<ReturnType<typeof envelopeSchema>>` の代替。
 */
export type Envelope<TData> =
  | {
      success: true;
      data: TData;
      meta?: { total: number; page: number; limit: number };
    }
  | {
      success: false;
      error: { code: ErrorCode; message: string };
    };
