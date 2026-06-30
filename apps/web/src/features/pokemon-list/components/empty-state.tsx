/**
 * 検索結果 0 件のときに描画する状態表示。
 *
 * 文言は「該当するポケモンが見つかりませんでした。条件を変えてみてください」で固定 (Open Question 解消済)。
 * grid と排他で、混在させない (Requirement: empty-state)。
 * セマンティック HTML `<output>` (= role="status" 相当) で SR に状態通知する。
 */
export function EmptyState() {
  return (
    <output className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed bg-muted/40 p-12 text-center">
      <p className="text-base font-medium">該当するポケモンが見つかりませんでした</p>
      <p className="text-sm text-muted-foreground">条件を変えてみてください</p>
    </output>
  );
}
