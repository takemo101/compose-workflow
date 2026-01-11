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

import type { Plugin } from "@opencode-ai/plugin";
import { SecurityScanner } from "./scanner";

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
 */
function extractString(args: unknown, ...keys: string[]): string {
  if (typeof args !== "object" || args === null) return "";
  const record = args as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string") return value;
  }
  return "";
}

/**
 * Security Scanプラグイン
 *
 * OpenCodeの起動時に呼び出され、Hooksオブジェクトを返します。
 * `tool.execute.before`フックを通じて、各ツール操作の前にセキュリティチェックを実行します。
 *
 * @see https://opencode.ai/docs/plugins/ - OpenCodeプラグインドキュメント
 */
export const SecurityScanPlugin: Plugin = async ({ project, client }) => {
  // スキャナーインスタンスを作成（プラグインのライフタイム中は再利用）
  const scanner = new SecurityScanner();

  // プラグイン初期化ログ
  await client.app.log({
    service: "security-scan",
    level: "info",
    message: "Security Scan Plugin initialized",
    extra: { project: project.name },
  });

  return {
    /**
     * tool.execute.before フック
     *
     * OpenCodeがツールを実行する直前に呼び出されます。
     * セキュリティ違反を検出した場合はErrorをthrowしてブロックします。
     *
     * @param input - ツール情報（tool: ツール名, sessionID, callID）
     * @param output - 出力オブジェクト（args: ツール引数を変更可能）
     * @throws Error - セキュリティ違反が検出された場合
     *
     * @see https://opencode.ai/docs/plugins/#env-protection
     */
    "tool.execute.before": async (input, output) => {
      const { tool } = input;
      const args = output.args;

      // ファイル読み取り操作（read）のチェック
      // 機密ファイルの読み取りをブロック
      if (tool === "read") {
        const filePath = extractString(args, "filePath", "file_path", "path");
        if (scanner.isSensitiveFile(filePath)) {
          throw new Error(
            `🚨 SECURITY BLOCK: Reading "${filePath}" is prohibited.\n` +
              `This file matches a sensitive file pattern (credentials, keys, secrets).`
          );
        }
      }

      // ファイル書き込み操作（write, edit）のチェック
      // 機密ファイルへの書き込みと、シークレットのハードコードを検出
      if (tool === "write" || tool === "edit") {
        const filePath = extractString(args, "filePath", "file_path", "path");
        const content = extractString(args, "content", "newString");
        const result = scanner.scanFileWrite(filePath, content);

        if (result.blocked) {
          throw new Error(result.reason);
        }
      }

      // bashコマンド実行のチェック
      // リダイレクトやtee等による機密ファイルへの書き込みを検出
      if (tool === "bash") {
        const command = extractString(args, "command");
        const result = scanner.scanBashCommand(command);

        if (result.blocked) {
          throw new Error(result.reason);
        }
      }

      // ファイル削除操作のチェック
      // 機密ファイルの誤削除を防止
      if (tool === "delete" || tool === "rm") {
        const filePath = extractString(args, "filePath", "path");
        const result = scanner.scanFileDelete(filePath);

        if (result.blocked) {
          throw new Error(result.reason);
        }
      }

      // セキュリティ違反なし - 処理を続行
    },
  };
};

// デフォルトエクスポート（OpenCodeがプラグインを読み込む際に使用）
export default SecurityScanPlugin;

// 他のファイルから直接インポートできるようにエクスポート
export { SecurityScanner } from "./scanner";
export * from "./patterns";
