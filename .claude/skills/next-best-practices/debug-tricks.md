# デバッグの小技

Next.js アプリのデバッグを速くするための小技集。

## MCP エンドポイント（開発サーバー）

Next.js は開発中、`/_next/mcp` エンドポイントを公開する。これにより MCP (Model Context Protocol) 経由で AI 支援デバッグが行える。

- **Next.js 16+**: 既定で有効。`next-devtools-mcp` を使う
- **Next.js < 16**: `next.config.js` で `experimental.mcpServer: true` が必要

参考: https://nextjs.org/docs/app/guides/mcp

**重要**: 動作中の Next.js dev サーバーの実際のポートを確認すること（ターミナル出力や `package.json` のスクリプトを参照）。ポート 3000 と決め打ちしない。

### リクエストフォーマット

エンドポイントは JSON-RPC 2.0 over HTTP POST。

```bash
curl -X POST http://localhost:<port>/_next/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "id": "1",
    "method": "tools/call",
    "params": {
      "name": "<tool-name>",
      "arguments": {}
    }
  }'
```

### 利用可能なツール

#### `get_errors`

dev サーバーの現在のエラーを取得（ビルドエラー、ソースマップ付き実行時エラースタック）:

```json
{ "name": "get_errors", "arguments": {} }
```

#### `get_routes`

ファイルシステムをスキャンして全ルートを取得:

```json
{ "name": "get_routes", "arguments": {} }
// Optional: { "name": "get_routes", "arguments": { "routerType": "app" } }
```

戻り値: `{ "appRouter": ["/", "/api/users/[id]", ...], "pagesRouter": [...] }`

#### `get_project_metadata`

プロジェクトのパスと dev サーバー URL を取得:

```json
{ "name": "get_project_metadata", "arguments": {} }
```

戻り値: `{ "projectPath": "/path/to/project", "devServerUrl": "http://localhost:3000" }`

#### `get_page_metadata`

現在のページレンダリングに関する実行時メタデータを取得（アクティブなブラウザセッションが必要）:

```json
{ "name": "get_page_metadata", "arguments": {} }
```

layout、境界、ページコンポーネントを示すセグメントトライのデータが返る。

#### `get_logs`

Next.js の開発ログファイルへのパスを取得:

```json
{ "name": "get_logs", "arguments": {} }
```

`<distDir>/logs/next-development.log` のパスが返る。

#### `get_server_action_by_id`

ID から Server Action を特定する:

```json
{ "name": "get_server_action_by_id", "arguments": { "actionId": "<action-id>" } }
```

### 例: エラー取得

```bash
curl -X POST http://localhost:<port>/_next/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":"1","method":"tools/call","params":{"name":"get_errors","arguments":{}}}'
```

## 特定ルートだけリビルド（Next.js 16+）

`--debug-build-paths` を使えば、アプリ全体ではなく特定のルートだけをリビルドできる。

```bash
# 特定のルートをリビルド
next build --debug-build-paths "/dashboard"

# glob にマッチするルートをリビルド
next build --debug-build-paths "/api/*"

# 動的ルート
next build --debug-build-paths "/blog/[slug]"
```

次のような場面で活用する:

- フルリビルドせずにビルド修正を素早く検証する
- 特定ページの静的生成の問題をデバッグする
- ビルドエラーへのイテレーションを高速化する
