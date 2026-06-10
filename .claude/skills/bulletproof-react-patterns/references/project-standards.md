# プロジェクト標準

## ESLint

`.eslintrc.js` (または flat config) でルールを設定し、よくあるミスを早期検出する。コードベース全体の一貫性を保ち、初期段階で誤りを捕まえる。

## Prettier

IDE で "format on save" を有効にする。`.prettierrc` に従って自動整形される。自動整形に失敗する場合は構文エラーのサインになる。ESLint と統合してフォーマットと lint を一体運用する。

## TypeScript

大規模リファクタ時に ESLint が見逃す問題を検出するために TypeScript を使う。リファクタ時はまず型宣言を更新し、その後プロジェクト全体の型エラーを解消していく。TypeScript はビルド時に型を検査するもので、実行時の障害を防ぐものではない。

参考: [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)

## Husky + lint-staged

各コミット前にコード検証を走らせて品質を保つ:

```shell
npm install -D husky lint-staged
npx husky init
```

```jsonc
// package.json
{
    "lint-staged": {
        "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
        "*.{json,md,yml}": ["prettier --write"],
    },
}
```

## 絶対 import

`../../../component` のような汚い相対パスを避けるため、絶対 import を必ず設定する:

```jsonc
// tsconfig.json
{
    "compilerOptions": {
        "baseUrl": ".",
        "paths": {
            "@/*": ["./src/*"],
        },
    },
}
```

alias は `@/*` 単一に統一する — 短く曖昧さがなく、ソース import と `node_modules` の import を明確に区別できる。

```typescript
// このような書き方ではなく:
import { Button } from "../../../components/ui/button";

// こう書く:
import { Button } from "@/components/ui/button";
```

## ファイル命名規約

ESLint でファイル / フォルダの kebab-case を強制する:

```javascript
"check-file/filename-naming-convention": [
  "error",
  { "**/*.{ts,tsx}": "KEBAB_CASE" },
  { ignoreMiddleExtensions: true }, // babel.config.js などの命名をサポート
],
"check-file/folder-naming-convention": [
  "error",
  { "src/**/!(__tests__)": "KEBAB_CASE" },
],
```

## 命名規約

| 項目          | 規約                   | 例                          |
| ------------- | ---------------------- | --------------------------- |
| Components    | PascalCase             | `UserCard.tsx`              |
| Hooks         | camelCase、`use` 接頭辞 | `useUsers.ts`              |
| Utilities     | camelCase              | `formatDate.ts`             |
| Types         | PascalCase             | `User`, `CreateUserInput`   |
| Constants     | UPPER_SNAKE_CASE       | `MAX_RETRIES`               |
| Directories   | kebab-case             | `user-settings/`            |
| Files         | kebab-case             | `user-card.tsx`             |
