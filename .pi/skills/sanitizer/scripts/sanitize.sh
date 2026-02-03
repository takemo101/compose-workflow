#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
# sanitize.sh - 外部入力のサニタイズスクリプト
#
# プロンプトインジェクション対策として、HTMLコメント、不可視文字、
# GitHubトークン等を除去・マスクする。
#
# Usage:
#   bash sanitize.sh <input-file>
#   bash sanitize.sh --stdin
#   echo "content" | bash sanitize.sh --stdin
#
# Based on: anthropics/claude-code-action sanitizer.ts
# ============================================================================

strip_html_comments() {
    sed 's/<!--[^>]*-->//g'
}

strip_invisible_chars() {
    perl -pe 's/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]//g' | \
    perl -pe 's/\x{200B}|\x{200C}|\x{200D}|\x{FEFF}//g' | \
    perl -pe 's/\x{00AD}//g' | \
    perl -pe 's/[\x{202A}-\x{202E}\x{2066}-\x{2069}]//g'
}

strip_markdown_image_alt() {
    sed 's/!\[[^]]*\](/![](/g'
}

strip_markdown_link_titles() {
    sed -E 's/(\[[^]]*\]\([^)]+)\s+"[^"]*"/\1/g' | \
    sed -E "s/(\[[^]]*\]\([^)]+)\s+'[^']*'/\1/g"
}

strip_hidden_attributes() {
    sed -E 's/\salt\s*=\s*"[^"]*"//gi' | \
    sed -E "s/\salt\s*=\s*'[^']*'//gi" | \
    sed -E 's/\salt\s*=\s*[^\s>]+//gi' | \
    sed -E 's/\stitle\s*=\s*"[^"]*"//gi' | \
    sed -E "s/\stitle\s*=\s*'[^']*'//gi" | \
    sed -E 's/\stitle\s*=\s*[^\s>]+//gi' | \
    sed -E 's/\saria-label\s*=\s*"[^"]*"//gi' | \
    sed -E "s/\saria-label\s*=\s*'[^']*'//gi" | \
    sed -E 's/\sdata-[a-zA-Z0-9-]+\s*=\s*"[^"]*"//gi' | \
    sed -E "s/\sdata-[a-zA-Z0-9-]+\s*=\s*'[^']*'//gi" | \
    sed -E 's/\splaceholder\s*=\s*"[^"]*"//gi' | \
    sed -E "s/\splaceholder\s*=\s*'[^']*'//gi"
}

redact_github_tokens() {
    perl -pe 's/\bghp_[A-Za-z0-9]{36}\b/[REDACTED_GITHUB_TOKEN]/g' | \
    perl -pe 's/\bgho_[A-Za-z0-9]{36}\b/[REDACTED_GITHUB_TOKEN]/g' | \
    perl -pe 's/\bghs_[A-Za-z0-9]{36}\b/[REDACTED_GITHUB_TOKEN]/g' | \
    perl -pe 's/\bghr_[A-Za-z0-9]{36}\b/[REDACTED_GITHUB_TOKEN]/g' | \
    perl -pe 's/\bgithub_pat_[A-Za-z0-9_]{11,221}\b/[REDACTED_GITHUB_TOKEN]/g'
}

sanitize() {
    strip_html_comments | \
    strip_invisible_chars | \
    strip_markdown_image_alt | \
    strip_markdown_link_titles | \
    strip_hidden_attributes | \
    redact_github_tokens
}

if [ $# -lt 1 ]; then
    echo "Usage: $0 <input-file> | --stdin" >&2
    exit 1
fi

if [ "$1" = "--stdin" ]; then
    cat | sanitize
else
    if [ ! -f "$1" ]; then
        echo "Error: File not found: $1" >&2
        exit 1
    fi
    cat "$1" | sanitize
fi
