#!/usr/bin/env node
// =============================================================================
// check-exact-versions.mjs
// =============================================================================
// 役割:
//   package.json と pnpm-workspace.yaml に SemVer range が含まれていないか
//   検査する。再現可能なビルドのため、直接依存と catalog は exact version
//   ("1.2.3") のみ許可する。
//
// 呼ばれるタイミング:
//   lefthook.yml の pre-commit から、staged な package.json /
//   pnpm-workspace.yaml を引数で受けて実行される。
//
// 検査ルール:
//   NG : "^1.2.3"  "~1.2.3"  ">=1.2.3"  "*"  "1.x"  "1 - 2"
//   OK : "1.2.3"  "catalog:"  "workspace:*"  "link:..."  "file:..."
//        "git+..."  "github:..."  "https?://..."  "npm:alias@1.2.3"
//
// exit:
//   0 : 全て exact / 検査対象なし
//   1 : range 検出 (stderr に該当箇所を出力)
// =============================================================================

import { readFileSync } from 'node:fs';
import { basename } from 'node:path';

import { parse as parseYaml } from 'yaml';

const PACKAGE_JSON_SECTIONS = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];

const EXACT_RE = /^\d+\.\d+\.\d+([-+][0-9A-Za-z.-]+)?$/;
const ALLOWED_PREFIX_RE = /^(catalog:|workspace:|link:|file:|git\+|github:|https?:\/\/)/;
const NPM_ALIAS_RE = /^npm:[^@]+@(.+)$/;

const isExact = (value) => {
  if (typeof value !== 'string') return true;
  if (ALLOWED_PREFIX_RE.test(value)) return true;
  const npmAlias = value.match(NPM_ALIAS_RE);
  if (npmAlias) return EXACT_RE.test(npmAlias[1]);
  return EXACT_RE.test(value);
};

const collectViolations = (entries, file, section) =>
  Object.entries(entries ?? {})
    .filter(([, value]) => !isExact(value))
    .map(([name, value]) => ({ file, section, name, value }));

const findPackageJsonViolations = (file) => {
  const json = JSON.parse(readFileSync(file, 'utf8'));
  return PACKAGE_JSON_SECTIONS.flatMap((section) => collectViolations(json[section], file, section));
};

const findWorkspaceYamlViolations = (file) => {
  const doc = parseYaml(readFileSync(file, 'utf8')) ?? {};
  const groups = {
    catalog: doc.catalog,
    ...Object.fromEntries(Object.entries(doc.catalogs ?? {}).map(([name, entries]) => [`catalogs.${name}`, entries])),
  };
  return Object.entries(groups).flatMap(([section, entries]) => collectViolations(entries, file, section));
};

const findViolations = (file) => {
  const name = basename(file);
  if (name === 'package.json') return findPackageJsonViolations(file);
  if (name === 'pnpm-workspace.yaml' || name === 'pnpm-workspace.yml') return findWorkspaceYamlViolations(file);
  return [];
};

const violations = process.argv.slice(2).flatMap(findViolations);

if (violations.length === 0) process.exit(0);

const report = [
  '[check-exact-versions] SemVer range を検出しました。',
  "再現可能なビルドのため exact version ('1.2.3') を要求します。",
  '',
  '違反箇所:',
  ...violations.flatMap(({ file, section, name, value }) => [`  ${file}`, `    ${section}.${name} = "${value}"`]),
  '',
  '修正方法:',
  '  - package.json        : 該当パッケージで `pnpm add -E <pkg>` で追加し直す',
  '                          (pnpm 11 では .npmrc の save-exact が機能しないため -E は必須)',
  "  - pnpm-workspace.yaml : catalog の値から '^' / '~' などの prefix を削除",
  '',
  '許容: exact (1.2.3) / catalog: / workspace:* / link: / file: / git+ / github: / https://',
].join('\n');

console.error(report);
process.exit(1);
