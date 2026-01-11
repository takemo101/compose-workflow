import { SecurityScanner } from "./scanner";

interface PermissionRequest {
  tool: string;
  arguments: Record<string, unknown>;
}

interface PermissionResponse {
  result: "deny" | "allow";
  reason?: string;
}

interface Plugin {
  name: string;
  description: string;
  permission: {
    handler: (request: PermissionRequest) => Promise<PermissionResponse | null>;
  };
}

function extractString(args: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = args?.[key];
    if (typeof value === "string") return value;
  }
  return "";
}

export default async function SecurityScanPlugin(): Promise<Plugin> {
  const scanner = new SecurityScanner();

  return {
    name: "security-scan",
    description:
      "Blocks writes to sensitive files (.env, *.pem, credentials.json, etc.) and detects hardcoded secrets",

    permission: {
      async handler(request: PermissionRequest): Promise<PermissionResponse | null> {
        const { tool, arguments: args } = request;

        if (tool === "write" || tool === "edit") {
          const filePath = extractString(args, "filePath", "file_path");
          const content = extractString(args, "content", "newString");
          const result = scanner.scanFileWrite(filePath, content);

          if (result.blocked) {
            return { result: "deny", reason: result.reason };
          }
        }

        if (tool === "bash") {
          const command = extractString(args, "command");
          const result = scanner.scanBashCommand(command);

          if (result.blocked) {
            return { result: "deny", reason: result.reason };
          }
        }

        if (tool === "delete" || tool === "rm") {
          const filePath = extractString(args, "filePath", "path");
          const result = scanner.scanFileDelete(filePath);

          if (result.blocked) {
            return { result: "deny", reason: result.reason };
          }
        }

        return null;
      },
    },
  };
}

export { SecurityScanner } from "./scanner";
export * from "./patterns";
