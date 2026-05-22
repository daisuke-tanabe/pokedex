// 本パッケージはドメイン公開契約 (API レスポンス・enum・ドメイン定数) のみを
// 提供する薄いライブラリで、各サブモジュールは名前空間が衝突しない設計になっている。
// `apps/api/src/db/schema/index.ts` (16+ テーブルを集約) のような追加追跡が必要な
// barrel ではないため、ここでは `export *` を採用し API 表面の追加を簡潔に保つ。
// typescript-coding-style.md の「`export *` を避ける」ルールはこのパッケージ境界の
// 設計判断として例外扱いとする。

export * from './constants.js';
export * from './enums/form-category.js';
export * from './enums/locale.js';
export * from './enums/sprite.js';
export * from './errors.js';
export * from './schemas/envelope.js';
