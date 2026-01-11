export const SENSITIVE_FILE_PATTERNS: RegExp[] = [
  /\.env$/,
  /\.env\..+$/,
  /credentials\.json$/,
  /.+-credentials\.json$/,
  /token\.json$/,
  /.+-token\.json$/,
  /\.token$/,
  /\.pem$/,
  /\.key$/,
  /\.p12$/,
  /\.pfx$/,
  /id_rsa/,
  /id_ed25519/,
  /id_ecdsa/,
  /secrets\.yaml$/,
  /secrets\.yml$/,
  /secrets\.json$/,
  /\.secrets$/,
  /terraform\.tfvars$/,
  /\.tfvars$/,
  /docker-compose\.override\.ya?ml$/,
];

export interface SecretPattern {
  pattern: RegExp;
  name: string;
}

export const SENSITIVE_CONTENT_PATTERNS: SecretPattern[] = [
  { pattern: /AKIA[0-9A-Z]{16}/, name: "AWS Access Key ID" },
  { pattern: /-----BEGIN[A-Z ]*PRIVATE KEY-----/, name: "Private Key" },
  { pattern: /ghp_[a-zA-Z0-9]{36}/, name: "GitHub Personal Access Token" },
  { pattern: /gho_[a-zA-Z0-9]{36}/, name: "GitHub OAuth Token" },
  { pattern: /github_pat_[a-zA-Z0-9_]{22,}/, name: "GitHub Fine-grained PAT" },
  { pattern: /sk-[a-zA-Z0-9]{48,}/, name: "OpenAI API Key" },
  { pattern: /sk-proj-[a-zA-Z0-9-_]{48,}/, name: "OpenAI Project API Key" },
  { pattern: /xox[baprs]-[0-9a-zA-Z-]+/, name: "Slack Token" },
  { pattern: /AIza[0-9A-Za-z-_]{35}/, name: "Google API Key" },
  { pattern: /SG\.[a-zA-Z0-9]{22}\.[a-zA-Z0-9-_]{43}/, name: "SendGrid API Key" },
  { pattern: /sk_live_[a-zA-Z0-9]{24,}/, name: "Stripe Live Key" },
  { pattern: /rk_live_[a-zA-Z0-9]{24,}/, name: "Stripe Restricted Key" },
  { pattern: /sq0atp-[a-zA-Z0-9-_]{22,}/, name: "Square Access Token" },
  { pattern: /sk-ant-[a-zA-Z0-9-_]{40,}/, name: "Anthropic API Key" },
];

export const BASH_WRITE_PATTERNS: RegExp[] = [
  />.*\.env/,
  />.*\.pem/,
  />.*credentials\.json/,
  />.*secrets\.(yaml|yml|json)/,
  /echo.*>.*\.(env|pem|key)/,
  /cat.*>.*\.(env|pem|key)/,
  /tee.*\.(env|pem|key)/,
];
