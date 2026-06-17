'use client';

import { SlidersHorizontal } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';

import { usePokemonSearchParams } from '../hooks/use-pokemon-search-params';
import { SearchForm } from './search-form';

/**
 * 検索フォームをハーフモーダル (下から競り上がる Drawer) に集約するトリガー + Drawer。
 *
 * 中身は既存 `SearchForm` をそのまま `DrawerContent` に入れるだけの薄いラッパで、
 * 選択は従来どおり nuqs 経由で URL state へ即時反映される (適用ボタンを持たない / Decision 1)。
 * Drawer の開閉 (ドラッグハンドル / オーバーレイ / Escape) は検索条件に影響しない
 * (条件は URL state に保持される)。トリガーには選択中タイプ件数を badge で表示し、
 * 0 件のときは出さない。
 */
export function SearchDrawer() {
  const { types } = usePokemonSearchParams();
  const typeCount = types.length;

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button type="button" variant="outline">
          <SlidersHorizontal />
          絞り込み
          {typeCount > 0 ? (
            <Badge variant="secondary" aria-label={`タイプ ${typeCount} 件選択中`}>
              {typeCount}
            </Badge>
          ) : null}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>検索</DrawerTitle>
          <DrawerDescription>図鑑とタイプで絞り込みます。選択は即時に反映されます。</DrawerDescription>
        </DrawerHeader>
        <div className="overflow-y-auto px-4 pb-6">
          <SearchForm />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
