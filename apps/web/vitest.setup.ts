import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';

import { server } from './src/test/msw/server';

beforeAll(() => {
  // Radix Select (shadcn) は内部で Element#hasPointerCapture / scrollIntoView を呼ぶが、
  // jsdom はこれらを実装していない (no-op で十分。テストでは「クリックで開いて項目を選ぶ」
  // という振る舞いの検証ができればよい)。
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = vi.fn(() => false) as Element['hasPointerCapture'];
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = vi.fn() as Element['releasePointerCapture'];
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = vi.fn() as Element['scrollIntoView'];
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
