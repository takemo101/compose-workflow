import { describe, it, expect } from "vitest";
import { SecurityScanner } from "./scanner";

const DUMMY = {
  awsKey: "AKIAIOSFODNN7EXAMPLE",
  privateKeyHeader: "-----BEGIN RSA PRIVATE KEY-----",
  githubPat: "ghp_" + "x".repeat(36),
  githubOauth: "gho_" + "x".repeat(36),
  githubFinePat: "github_pat_" + "x".repeat(22),
  openaiKey: "sk-" + "x".repeat(48),
  openaiProjectKey: "sk-proj-" + "x".repeat(48),
  slackToken: "xoxb-" + "0".repeat(12) + "-" + "0".repeat(13) + "-" + "a".repeat(24),
  googleApiKey: "AIzaSy" + "x".repeat(33),
  sendgridKey: "SG." + "x".repeat(22) + "." + "x".repeat(43),
  stripeLiveKey: "sk_live_" + "x".repeat(24),
  stripeRestrictedKey: "rk_live_" + "x".repeat(24),
  squareToken: "sq0atp-" + "x".repeat(22),
  anthropicKey: "sk-ant-" + "x".repeat(40),
};

describe("SecurityScanner", () => {
  const scanner = new SecurityScanner();

  describe("isSensitiveFile", () => {
    it.each([
      [".env", true],
      [".env.local", true],
      [".env.production", true],
      ["config/.env", true],
      ["credentials.json", true],
      ["gcp-credentials.json", true],
      ["token.json", true],
      ["private.pem", true],
      ["server.key", true],
      ["cert.p12", true],
      ["id_rsa", true],
      ["id_ed25519", true],
      ["secrets.yaml", true],
      ["secrets.yml", true],
      ["terraform.tfvars", true],
      ["prod.tfvars", true],
      ["docker-compose.override.yml", true],
      ["docker-compose.override.yaml", true],
      ["README.md", false],
      ["src/index.ts", false],
      ["package.json", false],
      [".envrc", false],
      ["environment.ts", false],
    ])("isSensitiveFile(%s) => %s", (filePath, expected) => {
      expect(scanner.isSensitiveFile(filePath)).toBe(expected);
    });

    it("returns false for empty string", () => {
      expect(scanner.isSensitiveFile("")).toBe(false);
    });
  });

  describe("detectSecret", () => {
    it("detects AWS Access Key ID", () => {
      expect(scanner.detectSecret(DUMMY.awsKey)).toBe("AWS Access Key ID");
    });

    it("detects Private Key", () => {
      expect(scanner.detectSecret(DUMMY.privateKeyHeader)).toBe("Private Key");
      expect(scanner.detectSecret("-----BEGIN PRIVATE KEY-----")).toBe("Private Key");
    });

    it("detects GitHub tokens", () => {
      expect(scanner.detectSecret(DUMMY.githubPat)).toBe("GitHub Personal Access Token");
      expect(scanner.detectSecret(DUMMY.githubOauth)).toBe("GitHub OAuth Token");
      expect(scanner.detectSecret(DUMMY.githubFinePat)).toBe("GitHub Fine-grained PAT");
    });

    it("detects OpenAI keys", () => {
      expect(scanner.detectSecret(DUMMY.openaiKey)).toBe("OpenAI API Key");
      expect(scanner.detectSecret(DUMMY.openaiProjectKey)).toBe("OpenAI Project API Key");
    });

    it("detects Slack token", () => {
      expect(scanner.detectSecret(DUMMY.slackToken)).toBe("Slack Token");
    });

    it("detects Google API key", () => {
      expect(scanner.detectSecret(DUMMY.googleApiKey)).toBe("Google API Key");
    });

    it("detects SendGrid key", () => {
      expect(scanner.detectSecret(DUMMY.sendgridKey)).toBe("SendGrid API Key");
    });

    it("detects Stripe keys", () => {
      expect(scanner.detectSecret(DUMMY.stripeLiveKey)).toBe("Stripe Live Key");
      expect(scanner.detectSecret(DUMMY.stripeRestrictedKey)).toBe("Stripe Restricted Key");
    });

    it("detects Square token", () => {
      expect(scanner.detectSecret(DUMMY.squareToken)).toBe("Square Access Token");
    });

    it("detects Anthropic key", () => {
      expect(scanner.detectSecret(DUMMY.anthropicKey)).toBe("Anthropic API Key");
    });

    it("returns null for safe content", () => {
      expect(scanner.detectSecret("const apiKey = process.env.API_KEY")).toBeNull();
      expect(scanner.detectSecret("export const config = {}")).toBeNull();
    });

    it("returns null for empty content", () => {
      expect(scanner.detectSecret("")).toBeNull();
    });

    it("detects secrets embedded in code", () => {
      const code = `const config = { apiKey: "${DUMMY.awsKey}" };`;
      expect(scanner.detectSecret(code)).toBe("AWS Access Key ID");
    });
  });

  describe("detectBashViolation", () => {
    it.each([
      ["echo 'secret' > .env", true],
      ["cat config > .env.local", true],
      ["echo $VAR > credentials.json", true],
      ["tee .env.production", true],
      ["echo 'key' > private.pem", true],
      ["> secrets.yaml", true],
      ["> secrets.json", true],
      ["ls -la", false],
      ["cat .env", false],
      ["grep secret .env", false],
      ["npm install", false],
    ])("detectBashViolation(%s) => %s", (command, expected) => {
      expect(scanner.detectBashViolation(command)).toBe(expected);
    });

    it("returns false for empty command", () => {
      expect(scanner.detectBashViolation("")).toBe(false);
    });
  });

  describe("scanFileWrite", () => {
    it("blocks write to sensitive file", () => {
      const result = scanner.scanFileWrite(".env", "API_KEY=xxx");
      expect(result.blocked).toBe(true);
      expect(result.blocked && result.reason).toContain("SECURITY BLOCK");
    });

    it("blocks content with secrets", () => {
      const result = scanner.scanFileWrite("config.ts", `const key = '${DUMMY.awsKey}'`);
      expect(result.blocked).toBe(true);
      expect(result.blocked && result.reason).toContain("SECRET DETECTED");
    });

    it("allows safe file with safe content", () => {
      const result = scanner.scanFileWrite("index.ts", "export const foo = 1");
      expect(result.blocked).toBe(false);
    });
  });

  describe("scanBashCommand", () => {
    it("blocks dangerous commands", () => {
      const result = scanner.scanBashCommand("echo secret > .env");
      expect(result.blocked).toBe(true);
    });

    it("allows safe commands", () => {
      const result = scanner.scanBashCommand("npm test");
      expect(result.blocked).toBe(false);
    });
  });

  describe("scanFileDelete", () => {
    it("blocks deletion of sensitive files", () => {
      const result = scanner.scanFileDelete(".env");
      expect(result.blocked).toBe(true);
    });

    it("allows deletion of normal files", () => {
      const result = scanner.scanFileDelete("temp.txt");
      expect(result.blocked).toBe(false);
    });
  });
});
