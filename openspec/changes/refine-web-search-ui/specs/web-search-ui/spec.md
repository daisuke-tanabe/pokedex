## ADDED Requirements

### Requirement: 検索 UI のハーフモーダル集約
検索フォーム (pokedex 選択 / type 絞り込み) はトップページ本文に常時展開せず、ハーフモーダル (`Drawer`) 内に集約 SHALL する。トップページにはモーダルを開くトリガーのみを配置し、トリガーには選択中のタイプ件数を表示 SHALL する。モーダル内の選択は即時に URL state へ反映され (適用ボタンを持たない)、モーダルの開閉は検索条件に影響を与えない。

#### Scenario: トリガークリックでモーダルが開く
- **WHEN** ユーザがトップページの検索トリガーをクリックする
- **THEN** 検索フォーム (pokedex 選択 / type 絞り込み) を含むハーフモーダルが開く

#### Scenario: モーダルを閉じても検索条件が保持される
- **WHEN** ユーザがモーダル内でタイプを選択する
- **AND** モーダルを閉じる
- **THEN** 選択は URL state に保持され、結果一覧の絞り込みが維持される

#### Scenario: モーダル内の選択が即時反映される
- **WHEN** ユーザがモーダル内で pokedex またはタイプを変更する
- **THEN** 適用ボタンを介さず即時に URL クエリと結果一覧へ反映される

#### Scenario: トリガーが選択中のタイプ件数を表示する
- **WHEN** タイプが 1 件以上選択されている
- **THEN** トリガーに選択中のタイプ件数が表示される
- **AND** タイプが 0 件のときは件数表示を出さない

### Requirement: タイプの色分け表示と非色依存
ポケモンのタイプ badge は `TypeSlug` ごとに定義された色トークンで色分け表示 SHALL する。色は補助的な手がかりに留め、各 badge は日本語ラベル文字を併記 SHALL し、色のみで意味を伝えてはならない (WCAG 1.4.1)。各タイプ色とラベル文字のコントラスト比は light / dark テーマとも 4.5:1 以上を確保 SHALL する。

#### Scenario: 既知の TypeSlug が色分け表示される
- **WHEN** カードまたは検索フォームが既知の `TypeSlug` の badge を描画する
- **THEN** その slug に対応する色クラスが適用される
- **AND** 日本語ラベル文字が併記される

#### Scenario: 未知の slug は色を当てずフォールバックする
- **WHEN** `TypeSlug` に含まれない未知の slug を描画する
- **THEN** タイプ色クラスを適用せず neutral な badge で raw 文字列を表示する

#### Scenario: 色のみに意味を依存させない
- **WHEN** タイプ badge を描画する
- **THEN** 色を取り除いてもラベル文字でタイプを識別できる

### Requirement: drawer コンポーネントの追加
`apps/web/src/components/ui/` に shadcn `drawer`（ハーフモーダル）コンポーネントを追加 SHALL する。

#### Scenario: drawer コンポーネントが存在する
- **WHEN** `apps/web/src/components/ui/` を参照する
- **THEN** `drawer.tsx` が存在する

#### Scenario: drawer が data-slot 属性を持つ
- **WHEN** drawer コンポーネントが描画される
- **THEN** shadcn 規約どおり `data-slot` 属性を持つ

### Requirement: 検索条件切替時のローディング表示
検索条件 (pokedex / types) を変更した直後の再 fetch 中は、変更前の一覧を表示し続けてはならず、ローディング (skeleton) を表示 SHALL する。RSC が供給する `initialPage` はマウント時点の検索条件にのみ `initialData` として適用 SHALL し、変更後の別 queryKey へ引き継いではならない。

#### Scenario: 検索条件を変えると再 fetch 中は skeleton を表示する
- **WHEN** 一覧表示済みの状態でユーザがタイプまたは pokedex を変更する
- **THEN** 新しい検索条件の fetch が完了するまで、変更前の一覧ではなく skeleton が表示される

#### Scenario: initialData は初期条件にのみ適用される
- **WHEN** 検索条件を変更して別の queryKey になる
- **THEN** `initialPage` はその queryKey に適用されず、データ取得完了まで pending 状態になる
