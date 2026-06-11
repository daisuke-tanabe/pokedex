import { TYPE_SLUG_VALUES, type PokemonListItem, type TypeSlug } from '@pokedex/contracts';
import Image from 'next/image';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { typeLabel } from '../lib/labels-type';

const POKEDEX_NUMBER_DIGITS = 4;
const SPRITE_SIZE = 96;

const TYPE_SLUG_SET = new Set<string>(TYPE_SLUG_VALUES);

const isTypeSlug = (value: string): value is TypeSlug => TYPE_SLUG_SET.has(value);

const formatPokedexNumber = (n: number): string => `#${n.toString().padStart(POKEDEX_NUMBER_DIGITS, '0')}`;

// contracts の `PokemonListItem.types` は `string[]` (API 側で picklist 制約していない)。
// 既知の `TypeSlug` のみ日本語ラベルに、未知の slug は raw を表示するフォールバックを置く。
const renderTypeLabel = (slug: string): string => (isTypeSlug(slug) ? typeLabel(slug) : slug);

// API が返す `defaultSpriteUrl` は本番では CDN URL になる予定だが、dev seed では
// `placeholder/...` の相対パス (実体無し) または空文字列を返すケースがある。
// 空 / placeholder の場合は `<Image>` を描画せず、neutral な fallback ボックスを表示することで
// 404 / Next.js Image の missing src 警告を抑える。
const isValidSpriteUrl = (url: string): boolean =>
  url.length > 0 && !url.startsWith('placeholder/') && !url.startsWith('/placeholder/');

function Sprite({ url, alt }: { url: string; alt: string }) {
  if (!isValidSpriteUrl(url)) {
    // 親 `<Card aria-label={item.nameJa}>` が SR にポケモン名を読み上げるため、
    // fallback の "no image" テキストは sighted ユーザ向けの視覚補助に留め `aria-hidden` で SR から隠す。
    // (`role="img"` を `<div>` に付けるのは `prefer-tag-over-role` lint と衝突するうえ、
    //  SR ユーザは Card の aria-label で十分にコンテキストを得られるため二重通知になる)
    return (
      <div
        aria-hidden
        className="flex aspect-square h-24 w-24 items-center justify-center rounded-md bg-muted/60 text-xs text-muted-foreground"
      >
        no image
      </div>
    );
  }
  return (
    <Image
      src={url}
      alt={alt}
      width={SPRITE_SIZE}
      height={SPRITE_SIZE}
      unoptimized
      className="aspect-square h-24 w-24 object-contain"
    />
  );
}

/**
 * 一覧 1 件分の表示専用カード。
 *
 * 本 change では詳細ページ遷移を持たず (Decision 9)、`<a>` / `<Link>` は使わない。
 * 次 change `add-web-detail-ui` で `<Link>` 化される予定 (構造変更最小に留める)。
 */
export function PokemonCard({ item }: { item: PokemonListItem }) {
  return (
    <Card aria-label={item.nameJa} className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-baseline justify-between gap-2">
          <span className="text-base font-semibold">{item.nameJa}</span>
          <span className="font-mono text-xs text-muted-foreground">{formatPokedexNumber(item.pokedexNumber)}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3">
        <Sprite url={item.defaultSpriteUrl} alt={item.nameJa} />
        <div className="flex flex-wrap justify-center gap-1">
          {item.types.map((slug) => (
            <Badge key={slug} variant="secondary">
              {renderTypeLabel(slug)}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
