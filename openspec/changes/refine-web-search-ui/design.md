## Context

`add-web-search-ui` の UI は機能的には完成しているが、見た目が味気ないという課題がある。本 change はミニマルさを保ったまま presentation を刷新する。挙動（検索の即時反映・URL state 同期・無限スクロール・カードの描画要素）は据え置き、配置・色・タイポグラフィのみを変える方針のため、spec デルタは ADDED-only で成立する（既存 Requirement の Scenario を壊さない）。

`web-search-ui` capability は `add-web-search-ui` が未アーカイブのため baseline 化されていない。MODIFIED は baseline を要求するため使えず、新たに検証可能になる behavior（モーダル集約・タイプ色の非色依存）を ADDED Requirement として同一 capability に積む。

## Goals / Non-Goals

**Goals:**
- 検索 UI をモーダルに集約し、トップページの初期表示を一覧主体にする
- タイプを色で即座に判別できるようにしつつ、色覚特性に配慮して色のみに意味を依存させない
- カードを図鑑らしい縦構成にし、視線誘導とミニマルさを両立する

**Non-Goals:**
- 検索の操作モデル変更（適用ボタン導入等）。即時反映を維持する
- 全国図鑑 001–1025 の表示範囲制御（別タスク）
- 詳細ページ遷移・ソート・検索履歴

## Decisions

### Decision 1: モーダルは即時反映（適用ボタンなし）
`SearchForm` を中身を変えずにハーフモーダル（`Drawer`）内へ移す薄いラッパ方式とする。選択は従来どおり nuqs 経由で URL と即時同期し、モーダルを閉じても条件は URL に残る。トリガーボタンには選択中タイプ件数を `[絞り込み・2]` のように表示し、閉じた状態でも条件が見えるようにする。
**Alternatives considered:** モーダル内をローカル下書きにして「適用」で確定する draft+commit 方式。state 二重管理とキャンセル / 適用仕様が増え、ミニマル志向と既存資産の温存に反するため不採用。type 選択は既に 300ms throttle があり中間状態のチラつきも抑えられている。

### Decision 2: タイプ色は定番パレット準拠・低〜中彩度の oklch トークン
ポケモンの事実上の定番タイプカラー（ほのお=赤橙、みず=青…）を土台に、彩度をやや落として既存のグレー基調・ミニマルトーンへ馴染ませる。`globals.css` の `:root` / `.dark` に `--color-type-<slug>`（18 色）を定義し、`@theme inline` には map しない（utility 生成ではなく `labels-type.ts` の className マップ経由で参照する）。
**Alternatives considered:** 高彩度の原色そのまま（判別最速だがページから浮く・ミニマル基調を崩す）、`chart-*` トークン流用（意味的に無関係で 5 色しかなく 18 タイプに足りない）。

### Decision 3: 色は補助、ラベル文字を必ず併記（WCAG 1.4.1 / 1.4.3）
badge は背景色 + 日本語ラベル文字の組で表示し、色のみで意味を伝えない。各タイプ色 vs ラベル文字のコントラスト比は light / dark とも 4.5:1 以上を確保する。実装後に a11y-reviewer で検証する。
**Alternatives considered:** 色ドットのみ / アイコンのみ（色覚特性・SR 双方で判別性が落ちる）。

### Decision 4: slug → color className マップは labels-type.ts に集約
既存の `TYPE_LABEL_MAP` / `typeLabel` と同じファイルに `TYPE_COLOR_CLASS: Record<TypeSlug, string>` と `typeColorClass(slug)` を追加し、`Record<TypeSlug, ...>` で 18 タイプの網羅性を型強制する。card / search-form の badge は raw slug ではなく既知 `TypeSlug` のときのみ色クラスを当て、未知 slug は既存のフォールバック（neutral badge + raw 表示）に倒す。
**Alternatives considered:** card 内にインラインで色分岐（再利用不可・網羅性を型で守れない）。

### Decision 5: カードは sprite → 番号 → 名前 → タイプの縦構成
一覧でまず目を引く sprite を最上部に置き、その下に番号（`font-mono`・細字・`text-muted-foreground`）、名前（`font-medium`）、タイプ badge の順で縦に積む。番号と名前の横並び（現 `CardTitle` の `flex justify-between`）を廃止する。ドロップシャドウは Card デフォルトより薄い `shadow-sm` 相当、余白は `CardHeader` / `CardContent` を一段詰める。
**Alternatives considered:** 番号→名前→sprite（ラベル先頭）。視線が画像へ届くのが遅く図鑑カードとして不自然なため不採用。

### Decision 6: shadcn drawer（ハーフモーダル）を追加
モーダルは shadcn `drawer`（vaul ベース）を `new-york-v4` registry から `add` する。下から競り上がるハーフモーダルで、ドラッグハンドル / オーバーレイタップ / Escape で閉じられ、背後の一覧が見える点が中央 Dialog より図鑑の絞り込み体験に合う。vaul 依存はバージョン固定（`1.1.2`）でプロジェクト方針に揃える。
**Alternatives considered:** 中央配置の `dialog`（radix ベース、背後を暗幕で覆い一覧が見えない）、`sheet` を `side="bottom"`（drag 操作なし）。「ハーフモーダル」の体験には vaul drawer が最も近いため drawer を採用。dialog は未使用となるため追加しない（pivot に伴い `dialog.tsx` は削除）。

### Decision 7: 検索条件切替時は initialData を初期 input に限定しローディングを出す
RSC が取得した `initialPage` は `useInfinitePokemonSearch` の `initialData` として供給するが、これを無条件で渡すと react-query が **検索条件変更後の別 queryKey まで initialData で seed** してしまい、`isPending` にならず古い一覧が success 状態で残る（= タイプ 2 件目選択時などに一瞬古い一覧が見える）。`initialData` は「マウント時点の検索条件（= RSC が取得した条件）と一致する input のときのみ」供給するよう `useRef` で初期 input を保持して限定する。これにより条件変更後の新しい queryKey は data 無し → pending に倒れ、`PokemonListView` が `<ListSkeleton>` を表示できる。
**Alternatives considered:** `showLoading` を `isFetching && !isFetchingNextPage` で判定（cached key 再訪や window refocus の background refetch でも skeleton が点滅する副作用があり不採用）。throttle / `placeholderData` も原因調査の結果シロ（nuqs は throttle 中も state を即時更新、QueryClient は素の既定で keepPreviousData 無し）。

## Risks / Trade-offs

- **18 色 × light/dark のコントラスト確保コスト**: 低彩度に寄せると文字とのコントラストが不足しやすい。→ a11y-reviewer で 4.5:1 を検証し、不足タイプは明度を調整する
- **モーダル化による検索動線の段数増**: 1 クリック増える。→ トリガーに件数バッジを出し、URL state でブックマーク / 共有は従来どおり維持することで体験低下を抑える
- **baseline 不在で MODIFIED が使えない**: 既存挙動を据え置く設計にしたため ADDED-only で破綻せず、`add-web-search-ui` の先行アーカイブも不要

## Migration Plan

DB / API 変更なし。FE presentation のみの変更で、URL クエリ互換も保たれるため後方互換性の懸念はない。`feat/add-web-search-ui` ブランチ上でそのまま実装する。
