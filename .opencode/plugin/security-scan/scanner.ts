/**
 * セキュリティスキャナー
 *
 * ファイル操作やbashコマンドをスキャンし、機密情報の漏洩リスクを検出します。
 * OpenCodeプラグインのpermissionハンドラから呼び出されます。
 */

import {
  SENSITIVE_FILE_PATTERNS,
  SENSITIVE_CONTENT_PATTERNS,
  BASH_WRITE_PATTERNS,
} from "./patterns";

/**
 * スキャン結果の型
 *
 * blocked: false - 操作を許可
 * blocked: true  - 操作をブロック（reasonに理由を含む）
 */
export type ScanResult =
  | { blocked: false }
  | { blocked: true; reason: string };

/**
 * セキュリティスキャナークラス
 *
 * 以下の3種類のスキャンを提供します：
 * 1. ファイルパスのスキャン - 機密ファイルへのアクセスを検出
 * 2. コンテンツのスキャン - ハードコードされたシークレットを検出
 * 3. bashコマンドのスキャン - シェル経由の機密ファイル書き込みを検出
 */
export class SecurityScanner {
  /**
   * ファイルパスが機密ファイルかどうかを判定
   *
   * @param filePath - チェック対象のファイルパス
   * @returns 機密ファイルの場合true
   *
   * @example
   * isSensitiveFile(".env")           // true
   * isSensitiveFile("credentials.json") // true
   * isSensitiveFile("index.ts")       // false
   */
  isSensitiveFile(filePath: string): boolean {
    if (!filePath) return false;
    // パターン配列のいずれかにマッチするかチェック
    return SENSITIVE_FILE_PATTERNS.some((regex) => regex.test(filePath));
  }

  /**
   * コンテンツ内のシークレット（APIキー等）を検出
   *
   * @param content - スキャン対象の文字列（ファイル内容など）
   * @returns 検出されたシークレットの名前（未検出時はnull）
   *
   * @example
   * detectSecret("AKIAIOSFODNN7EXAMPLE") // "AWS Access Key ID"
   * detectSecret("const x = 1")           // null
   */
  detectSecret(content: string): string | null {
    if (!content) return null;
    // パターン配列を順番にチェックし、最初にマッチしたものを返す
    const found = SENSITIVE_CONTENT_PATTERNS.find(({ pattern }) => pattern.test(content));
    return found?.name ?? null;
  }

  /**
   * bashコマンドが機密ファイルへの書き込みを含むかチェック
   *
   * @param command - チェック対象のbashコマンド
   * @returns 違反がある場合true
   *
   * @example
   * detectBashViolation("echo x > .env")  // true
   * detectBashViolation("npm install")    // false
   */
  detectBashViolation(command: string): boolean {
    if (!command) return false;
    return BASH_WRITE_PATTERNS.some((pattern) => pattern.test(command));
  }

  /**
   * ファイル書き込み操作をスキャン
   *
   * 以下の2点をチェックします：
   * 1. 書き込み先が機密ファイルでないか
   * 2. 書き込み内容にシークレットが含まれていないか
   *
   * @param filePath - 書き込み先のファイルパス
   * @param content - 書き込む内容
   * @returns スキャン結果（ブロックするかどうかと理由）
   */
  scanFileWrite(filePath: string, content: string): ScanResult {
    // チェック1: 機密ファイルへの書き込みをブロック
    if (this.isSensitiveFile(filePath)) {
      return {
        blocked: true,
        reason:
          `🚨 SECURITY BLOCK: Writing to "${filePath}" is prohibited.\n` +
          `This file matches a sensitive file pattern (credentials, keys, secrets).\n` +
          `If you need to modify this file, please do so manually.`,
      };
    }

    // チェック2: コンテンツ内のシークレットを検出
    const detectedSecret = this.detectSecret(content);
    if (detectedSecret) {
      return {
        blocked: true,
        reason:
          `🚨 SECRET DETECTED: Content contains a potential ${detectedSecret}.\n` +
          `Hardcoding secrets in source code is prohibited.\n` +
          `Use environment variables or a secrets manager instead.`,
      };
    }

    // 問題なし
    return { blocked: false };
  }

  /**
   * bashコマンドをスキャン
   *
   * シェルコマンド経由で機密ファイルに書き込もうとしていないかチェックします。
   * リダイレクト（>）やteeコマンドなどを監視します。
   *
   * @param command - 実行しようとしているbashコマンド
   * @returns スキャン結果
   */
  scanBashCommand(command: string): ScanResult {
    if (this.detectBashViolation(command)) {
      return {
        blocked: true,
        reason:
          `🚨 SECURITY BLOCK: Bash command attempts to write to sensitive file\n` +
          `Terminal commands that write to sensitive files are blocked.`,
      };
    }
    return { blocked: false };
  }

  /**
   * ファイル削除操作をスキャン
   *
   * 機密ファイルの削除を防止します。
   * 誤って重要な認証情報ファイルを削除することを防ぎます。
   *
   * @param filePath - 削除対象のファイルパス
   * @returns スキャン結果
   */
  scanFileDelete(filePath: string): ScanResult {
    if (this.isSensitiveFile(filePath)) {
      return {
        blocked: true,
        reason:
          `🚨 SECURITY BLOCK: Deleting "${filePath}" is prohibited.\n` +
          `This file matches a sensitive file pattern.\n` +
          `If you need to delete this file, please do so manually.`,
      };
    }
    return { blocked: false };
  }
}
