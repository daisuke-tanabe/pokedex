## 1. タイプ色トークンと className マップ

- [x] 1.1 `globals.css` の `:root` / `.dark` に `--color-type-<slug>`（18 タイプ）を定番パレット準拠・低〜中彩度の oklch で定義する
- [x] 1.2 `labels-type.ts` に `TYPE_COLOR_CLASS: Record<TypeSlug, string>` と `typeColorClass(slug)` を追加し、18 タイプの網羅性を型で強制する
- [x] 1.3 badge への色適用ヘルパが未知 slug では色を当てず neutral フォールバックに倒す分岐を持つことを確認する

## 2. shadcn drawer（ハーフモーダル）の追加

- [x] 2.1 `pnpm dlx shadcn@latest add drawer`（`new-york-v4`）で `apps/web/src/components/ui/drawer.tsx` を生成する（vaul 依存はバージョン固定に揃える）
- [x] 2.2 生成物が `data-slot` 属性を持つことを確認する

## 3. 検索ハーフモーダルコンポーネント

- [x] 3.1 トリガーボタン + `Drawer` + 既存 `SearchForm` を組む検索ハーフモーダル（`search-drawer.tsx`）を `features/pokemon-list/components/` に追加する
- [x] 3.2 トリガーに選択中タイプ件数バッジ（例 `絞り込み・2`）を表示する。0 件のときはバッジを出さない
- [x] 3.3 モーダル内の選択が即時に URL state へ反映される（適用ボタンなし）ことを確認する
- [x] 3.4 トップページ（`PokemonListView` / `page.tsx`）から常時展開していた `SearchForm` を外し、検索ハーフモーダルのトリガーに置き換える

## 4. ポケモンカード再設計

- [x] 4.1 `pokemon-card.tsx` を sprite → 番号 → 名前 → タイプの縦構成へ変更（番号と名前の横並びを廃止）
- [x] 4.2 番号を `font-mono`・細字・`text-muted-foreground`、名前を `font-medium` にする（番号は太字にしない）
- [x] 4.3 ドロップシャドウを `shadow-sm` 相当に薄くし、`CardHeader` / `CardContent` の余白を一段詰める
- [x] 4.4 タイプ badge に `typeColorClass` を適用し、日本語ラベル文字を併記したまま色分けする

## 5. テスト

- [x] 5.1 検索モーダルの開閉（トリガークリックで開く / 閉じる）を RTL で検証する
- [x] 5.2 トリガーの件数バッジが選択タイプ数に応じて表示 / 非表示されることを検証する
- [x] 5.3 各タイプ badge に対応する色クラスが適用され、かつラベル文字が併記されることを検証する
- [x] 5.4 モーダル内の選択が即時に URL state を更新することを検証する

## 6. 検索条件切替時のローディング

- [x] 6.1 `use-infinite-pokemon-search.ts` で `initialData` を「マウント時点の input と一致するときのみ」供給するよう限定し、条件変更後の別 queryKey へ引き継がれない（古い一覧が残らない）ようにする
- [x] 6.2 検索条件変更で別 queryKey になると pending に倒れ skeleton を出せることを RTL / hook テストで検証する
- [x] 6.3 未使用になった `dialog.tsx` を削除する（drawer pivot に伴うクリーンアップ）
- [x] 6.4 vaul の jsdom 依存（matchMedia / setPointerCapture）を `vitest.setup.ts` に polyfill する

## 7. タイプ選択の FIFO 退避

- [x] 7.1 `use-pokemon-search-params.ts` の `setTypes` を、MAX_TYPES 超過時に reject せず末尾 MAX_TYPES 件を残す（最古を退避する）FIFO に変更する（例: ほのお→くさ→でんき で くさ,でんき）
- [x] 7.2 hook / search-form テストを FIFO 挙動に更新し、ユーザー例（ほのお→くさ→でんき ⇒ grass,electric）の検証を追加する
- [x] 7.3 `add-web-search-ui` の Scenario「MAX_TYPES を超える選択は受け付けない」を FIFO 退避に更新する（要件本文は既に「最古の選択を退避する」を許容）

## 8. 仕上げ・検証

- [x] 8.1 `a11y-reviewer` でタイプ色 vs ラベル文字のコントラスト 4.5:1（light / dark）と色非依存を検証し、不足タイプの明度を調整する
- [x] 8.2 lint / typecheck / test を green にする
- [x] 8.3 `openspec validate refine-web-search-ui --strict` を通す
