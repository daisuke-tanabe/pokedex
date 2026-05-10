import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '../../..');

async function readText(path: string): Promise<string> {
  return await readFile(resolve(ROOT, path), 'utf-8');
}

interface TurboConfig {
  tasks: Record<string, { cache?: boolean; persistent?: boolean; dependsOn?: string[] }>;
}

interface PackageJson {
  scripts: Record<string, string>;
}

describe('monorepo-foundation の整合', () => {
  it('pnpm-workspace.yaml に apps/* と packages/* が含まれる', async () => {
    const content = await readText('pnpm-workspace.yaml');
    expect(content).toMatch(/['"]apps\/\*['"]|-\s+apps\/\*/);
    expect(content).toMatch(/['"]packages\/\*['"]|-\s+packages\/\*/);
  });

  it('turbo.json に必須 7 タスクが定義されている', async () => {
    const parsed = JSON.parse(await readText('turbo.json')) as TurboConfig;
    for (const key of ['dev', 'build', 'test', 'typecheck', 'lint', 'format', 'format:check']) {
      expect(parsed.tasks).toHaveProperty(key);
    }
  });

  it('turbo.json の dev は cache: false かつ persistent: true', async () => {
    const parsed = JSON.parse(await readText('turbo.json')) as TurboConfig;
    expect(parsed.tasks.dev?.cache).toBe(false);
    expect(parsed.tasks.dev?.persistent).toBe(true);
  });

  it('turbo.json の build.dependsOn に "^build" が含まれる', async () => {
    const parsed = JSON.parse(await readText('turbo.json')) as TurboConfig;
    expect(parsed.tasks.build?.dependsOn).toContain('^build');
  });

  it('apps/api の必須スクリプトが揃う', async () => {
    const pkg = JSON.parse(await readText('apps/api/package.json')) as PackageJson;
    for (const key of ['dev', 'build', 'test', 'typecheck', 'lint', 'format', 'format:check']) {
      expect(pkg.scripts).toHaveProperty(key);
    }
  });

  it('packages/contracts の必須スクリプトが揃う', async () => {
    const pkg = JSON.parse(await readText('packages/contracts/package.json')) as PackageJson;
    for (const key of ['test', 'typecheck', 'lint', 'format', 'format:check']) {
      expect(pkg.scripts).toHaveProperty(key);
    }
  });

  it('.gitignore に env 系のエントリが含まれる', async () => {
    const content = await readText('.gitignore');
    expect(content).toMatch(/^\.env$/m);
    expect(content).toMatch(/^\.env\.local$/m);
  });

  it('.env.development が DATABASE_URL を含み、Supabase ローカル既定値である', async () => {
    const content = await readText('.env.development');
    expect(content).toMatch(/^DATABASE_URL=/m);
    expect(content).toMatch(/127\.0\.0\.1|localhost/);
    expect(content).toMatch(/:54322/);
    expect(content).toMatch(/\/postgres/);
    expect(content).toMatch(/postgres:postgres/);
  });

  it('.env.development が機密パターン (SECRET / API_KEY / TOKEN / 末尾 PASSWORD) を含まない', async () => {
    const content = await readText('.env.development');
    expect(content).not.toMatch(/^(SECRET|API_KEY|.*_TOKEN|.*_PASSWORD).*=/m);
  });

  it('supabase/config.toml が存在する', async () => {
    await expect(readText('supabase/config.toml')).resolves.toBeTruthy();
  });

  it('.tool-versions に supabase 行が含まれる', async () => {
    const content = await readText('.tool-versions');
    expect(content).toMatch(/^supabase\s+\S+$/m);
  });

  it('README に env 管理方針 (GitHub Secrets / 各ホスティングで注入) が書かれている', async () => {
    const content = await readText('README.md');
    expect(content).toMatch(/GitHub Secrets/);
  });
});
