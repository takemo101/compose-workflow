import {
  SENSITIVE_FILE_PATTERNS,
  SENSITIVE_CONTENT_PATTERNS,
  BASH_WRITE_PATTERNS,
} from "./patterns";

export type ScanResult =
  | { blocked: false }
  | { blocked: true; reason: string };

export class SecurityScanner {
  isSensitiveFile(filePath: string): boolean {
    if (!filePath) return false;
    return SENSITIVE_FILE_PATTERNS.some((regex) => regex.test(filePath));
  }

  detectSecret(content: string): string | null {
    if (!content) return null;
    const found = SENSITIVE_CONTENT_PATTERNS.find(({ pattern }) => pattern.test(content));
    return found?.name ?? null;
  }

  detectBashViolation(command: string): boolean {
    if (!command) return false;
    return BASH_WRITE_PATTERNS.some((pattern) => pattern.test(command));
  }

  scanFileWrite(filePath: string, content: string): ScanResult {
    if (this.isSensitiveFile(filePath)) {
      return {
        blocked: true,
        reason:
          `🚨 SECURITY BLOCK: Writing to "${filePath}" is prohibited.\n` +
          `This file matches a sensitive file pattern (credentials, keys, secrets).\n` +
          `If you need to modify this file, please do so manually.`,
      };
    }

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

    return { blocked: false };
  }

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
