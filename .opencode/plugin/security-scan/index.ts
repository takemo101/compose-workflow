/**
 * Security Scan Plugin for OpenCode
 *
 * このプラグインは、AIエージェントによる機密ファイルへの誤操作を防止します。
 *
 * 主な機能:
 * 1. 機密ファイル（.env, *.pem, credentials.json等）への書き込み・削除をブロック
 * 2. ソースコード内のハードコードされたAPIキーを検出してブロック
 * 3. bashコマンド経由での機密ファイル書き込みを防止
 *
 * 使用方法:
 * このファイルを .opencode/plugin/ ディレクトリに配置すると自動的に読み込まれます。
 */

import { SecurityScanner } from "./scanner";

/**
 * OpenCodeプラグインのpermissionリクエスト型
 *
 * OpenCodeがツール（write, edit, bash等）を実行する前に、
 * プラグインに対して許可を求める際のリクエスト形式です。
 */
interface PermissionRequest {
  /** 実行しようとしているツール名（write, edit, bash, delete等） */
  tool: string;
  /** ツールに渡される引数 */
  arguments: Record<string, unknown>;
}

/**
 * permissionハンドラのレスポンス型
 *
 * "deny": 操作を拒否（reasonに理由を含める）
 * "allow": 操作を許可
 */
interface PermissionResponse {
  result: "deny" | "allow";
  reason?: string;
}

/**
 * OpenCodeプラグインの型定義
 */
interface Plugin {
  name: string;
  description: string;
  permission: {
    handler: (request: PermissionRequest) => Promise<PermissionResponse | null>;
  };
}

/**
 * 引数オブジェクトから文字列値を安全に取得するヘルパー関数
 *
 * OpenCodeのツールは引数名が統一されていないことがあるため、
 * 複数のキー名を試して最初に見つかった文字列値を返します。
 *
 * @param args - ツールの引数オブジェクト
 * @param keys - 試すキー名の配列（優先順）
 * @returns 見つかった文字列値、または空文字列
 *
 * @example
 * extractString({filePath: "test.ts"}, "filePath", "file_path") // "test.ts"
 * extractString({file_path: "test.ts"}, "filePath", "file_path") // "test.ts"
 */
function extractString(args: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = args?.[key];
    if (typeof value === "string") return value;
  }
  return "";
}

/**
 * Security Scanプラグインのエントリポイント
 *
 * OpenCodeの起動時に呼び出され、プラグインオブジェクトを返します。
 * プラグインはpermissionハンドラを通じて、各ツール操作の前に
 * セキュリティチェックを実行します。
 *
 * @returns プラグインオブジェクト
 */
export default async function SecurityScanPlugin(): Promise<Plugin> {
  // スキャナーインスタンスを作成（プラグインのライフタイム中は再利用）
  const scanner = new SecurityScanner();

  return {
    name: "security-scan",
    description:
      "Blocks writes to sensitive files (.env, *.pem, credentials.json, etc.) and detects hardcoded secrets",

    permission: {
      /**
       * permissionハンドラ
       *
       * OpenCodeがツールを実行する前に呼び出されます。
       * セキュリティ違反を検出した場合は操作を拒否し、
       * 問題がなければnullを返して他のプラグインやデフォルト処理に委譲します。
       */
      async handler(request: PermissionRequest): Promise<PermissionResponse | null> {
        const { tool, arguments: args } = request;

        // ファイル書き込み操作（write, edit）のチェック
        // 機密ファイルへの書き込みと、シークレットのハードコードを検出
        if (tool === "write" || tool === "edit") {
          const filePath = extractString(args, "filePath", "file_path");
          const content = extractString(args, "content", "newString");
          const result = scanner.scanFileWrite(filePath, content);

          if (result.blocked) {
            return { result: "deny", reason: result.reason };
          }
        }

        // bashコマンド実行のチェック
        // リダイレクトやtee等による機密ファイルへの書き込みを検出
        if (tool === "bash") {
          const command = extractString(args, "command");
          const result = scanner.scanBashCommand(command);

          if (result.blocked) {
            return { result: "deny", reason: result.reason };
          }
        }

        // ファイル削除操作のチェック
        // 機密ファイルの誤削除を防止
        if (tool === "delete" || tool === "rm") {
          const filePath = extractString(args, "filePath", "path");
          const result = scanner.scanFileDelete(filePath);

          if (result.blocked) {
            return { result: "deny", reason: result.reason };
          }
        }

        // セキュリティ違反なし - 他のプラグインやデフォルト処理に委譲
        return null;
      },
    },
  };
}

// 他のファイルから直接インポートできるようにエクスポート
export { SecurityScanner } from "./scanner";
export * from "./patterns";
