import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';

import { server } from './src/test/msw/server';

beforeAll(() => {
  // Radix Select (shadcn) は内部で Element#hasPointerCapture / scrollIntoView を呼ぶが、
  // jsdom はこれらを実装していない (no-op で十分。テストでは「クリックで開いて項目を選ぶ」
  // という振る舞いの検証ができればよい)。
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = vi.fn(() => false);
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = vi.fn() as Element['releasePointerCapture'];
  }
  // vaul (Drawer) は drag 判定のため content 内の pointerdown で setPointerCapture を呼ぶ。
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = vi.fn() as Element['setPointerCapture'];
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = vi.fn() as Element['scrollIntoView'];
  }
  // vaul (Drawer) は mount 時に matchMedia を参照するが jsdom は未実装。
  // reduced-motion 等の判定に使うだけなので「常に非マッチ」で十分。
  if (typeof window.matchMedia !== 'function') {
    window.matchMedia = vi.fn((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(() => false),
    }));
  }
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  // vitest は jest と異なり RTL の auto-cleanup が効かないため明示的に呼ぶ。
  // 怠ると前のテストの DOM が残り、`getByText` が複数マッチで失敗する (例: PokemonCard test)。
  cleanup();
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
