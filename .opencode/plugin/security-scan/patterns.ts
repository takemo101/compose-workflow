/**
 * セキュリティスキャンで使用するパターン定義
 *
 * このファイルは、機密ファイルの検出パターンとAPIキーの検出パターンを一元管理します。
 * 新しいパターンを追加する場合は、このファイルを編集してください。
 */

/**
 * 機密ファイルのパターン一覧
 *
 * これらのパターンにマッチするファイルへの書き込み・削除をブロックします。
 * 正規表現で定義されており、ファイルパスの末尾または全体にマッチします。
 */
export const SENSITIVE_FILE_PATTERNS: RegExp[] = [
	// 環境変数ファイル（.env, .env.local, .env.production など）
	// APIキーやデータベース接続情報が含まれることが多い
	/\.env$/,
	/\.env\..+$/,

	// 認証情報ファイル（GCPサービスアカウント、OAuth設定など）
	/credentials\.json$/,
	/.+-credentials\.json$/,

	// トークンファイル（OAuth トークン、アクセストークンなど）
	/token\.json$/,
	/.+-token\.json$/,
	/\.token$/,

	// 秘密鍵・証明書ファイル
	// SSL/TLS証明書、SSH鍵、コード署名用の鍵など
	/\.pem$/, // PEM形式の鍵・証明書
	/\.key$/, // 秘密鍵ファイル
	/\.p12$/, // PKCS#12形式（証明書と秘密鍵のバンドル）
	/\.pfx$/, // PFX形式（Windowsで使用されるPKCS#12）
	/id_rsa/, // RSA SSH秘密鍵
	/id_ed25519/, // Ed25519 SSH秘密鍵
	/id_ecdsa/, // ECDSA SSH秘密鍵

	// シークレット管理ファイル
	// Kubernetes Secrets、アプリケーション設定など
	/secrets\.yaml$/,
	/secrets\.yml$/,
	/secrets\.json$/,
	/\.secrets$/,

	// クラウドインフラ設定ファイル
	// Terraformの変数ファイルには機密情報が含まれることが多い
	/terraform\.tfvars$/,
	/\.tfvars$/,

	// Docker Compose ローカル上書きファイル
	// 開発環境固有の設定や機密情報が含まれることがある
	/docker-compose\.override\.ya?ml$/,
];

/**
 * シークレットパターンの型定義
 */
export interface SecretPattern {
	/** 検出用の正規表現パターン */
	pattern: RegExp;
	/** 検出時に表示する名前（ログやエラーメッセージ用） */
	name: string;
}

/**
 * APIキー・シークレットの検出パターン一覧
 *
 * ファイル内容をスキャンして、ハードコードされた機密情報を検出します。
 * 各パターンは、実際のAPIキーの形式に基づいて定義されています。
 */
export const SENSITIVE_CONTENT_PATTERNS: SecretPattern[] = [
	// AWS Access Key ID
	// 形式: "AKIA" + 16文字の英数字（大文字）
	// 例: AKIAIOSFODNN7EXAMPLE
	{ pattern: /AKIA[0-9A-Z]{16}/, name: "AWS Access Key ID" },

	// 秘密鍵のヘッダー
	// PEM形式の秘密鍵ファイルの開始行を検出
	{ pattern: /-----BEGIN[A-Z ]*PRIVATE KEY-----/, name: "Private Key" },

	// GitHub Personal Access Token (classic)
	// 形式: "ghp_" + 36文字の英数字
	{ pattern: /ghp_[a-zA-Z0-9]{36}/, name: "GitHub Personal Access Token" },

	// GitHub OAuth Token
	// 形式: "gho_" + 36文字の英数字
	{ pattern: /gho_[a-zA-Z0-9]{36}/, name: "GitHub OAuth Token" },

	// GitHub Fine-grained Personal Access Token
	// 形式: "github_pat_" + 22文字以上の英数字とアンダースコア
	{ pattern: /github_pat_[a-zA-Z0-9_]{22,}/, name: "GitHub Fine-grained PAT" },

	// OpenAI API Key
	// 形式: "sk-" + 48文字以上の英数字
	{ pattern: /sk-[a-zA-Z0-9]{48,}/, name: "OpenAI API Key" },

	// OpenAI Project API Key
	// 形式: "sk-proj-" + 48文字以上の英数字とハイフン、アンダースコア
	{ pattern: /sk-proj-[a-zA-Z0-9-_]{48,}/, name: "OpenAI Project API Key" },

	// Slack Token
	// 形式: "xox" + トークンタイプ(b/a/p/r/s) + "-" + 英数字とハイフン
	// b=bot, a=user, p=legacy, r=refresh, s=user(新形式)
	{ pattern: /xox[baprs]-[0-9a-zA-Z-]+/, name: "Slack Token" },

	// Google API Key
	// 形式: "AIza" + 35文字の英数字とハイフン、アンダースコア
	{ pattern: /AIza[0-9A-Za-z-_]{35}/, name: "Google API Key" },

	// SendGrid API Key
	// 形式: "SG." + 22文字 + "." + 43文字
	{
		pattern: /SG\.[a-zA-Z0-9]{22}\.[a-zA-Z0-9-_]{43}/,
		name: "SendGrid API Key",
	},

	// Stripe Live Secret Key
	// 形式: "sk_live_" + 24文字以上の英数字
	{ pattern: /sk_live_[a-zA-Z0-9]{24,}/, name: "Stripe Live Key" },

	// Stripe Restricted Key
	// 形式: "rk_live_" + 24文字以上の英数字
	{ pattern: /rk_live_[a-zA-Z0-9]{24,}/, name: "Stripe Restricted Key" },

	// Square Access Token
	// 形式: "sq0atp-" + 22文字以上の英数字とハイフン、アンダースコア
	{ pattern: /sq0atp-[a-zA-Z0-9-_]{22,}/, name: "Square Access Token" },

	// Anthropic API Key
	// 形式: "sk-ant-" + 40文字以上の英数字とハイフン、アンダースコア
	{ pattern: /sk-ant-[a-zA-Z0-9-_]{40,}/, name: "Anthropic API Key" },
];

/**
 * bashコマンドでの機密ファイル書き込み検出パターン
 *
 * シェルコマンド経由で機密ファイルに書き込もうとする操作を検出します。
 * リダイレクト演算子（>）やteeコマンドなどを監視します。
 */
export const BASH_WRITE_PATTERNS: RegExp[] = [
	// リダイレクトで.envファイルに書き込み
	// 例: echo "SECRET=xxx" > .env
	/>.*\.env/,

	// リダイレクトで.pemファイルに書き込み
	// 例: cat key > private.pem
	/>.*\.pem/,

	// リダイレクトでcredentials.jsonに書き込み
	// 例: echo '{}' > credentials.json
	/>.*credentials\.json/,

	// リダイレクトでsecretsファイルに書き込み
	// 例: > secrets.yaml
	/>.*secrets\.(yaml|yml|json)/,

	// echoコマンドでの書き込み
	// 例: echo "key" > .env
	/echo.*>.*\.(env|pem|key)/,

	// catコマンドでの書き込み
	// 例: cat source > .env
	/cat.*>.*\.(env|pem|key)/,

	// teeコマンドでの書き込み
	// 例: echo "key" | tee .env
	/tee.*\.(env|pem|key)/,
];
