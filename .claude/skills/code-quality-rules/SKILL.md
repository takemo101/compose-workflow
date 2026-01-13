---
name: code-quality-rules
description: 実装時に遵守すべきコード品質ルール（500行ルール、固定アーキテクチャ、SOLID原則、命名規則、テストカバレッジ要件）を定義
---

# コード品質ルール

本ドキュメントは、実装時に遵守すべきコード品質ルールを定義します。

## 1. 500行ルール

### 1.1 ルール定義

**1ファイルあたり500行を上限**とします。

| 条件 | 対応 |
|------|------|
| 500行以下 | OK |
| 500行超過 | **自動分割を実行** |

### 1.2 500行を超えた場合の対応

1. 実装時にエージェントが自動で分割を実行
2. 分割後に品質チェックを再実行
3. すべて500行以下になるまで繰り返し
4. 分割が技術的に困難な場合のみTODOに記録

### 1.3 分割の指針

| レイヤー | 分割方針 |
|---------|---------|
| Domain | Entity → Value Object抽出、Domain Service分離 |
| Application | UseCase分割、Query/Command分離（CQRS） |
| Infrastructure | Repository実装分割、外部サービスAdapter分離 |
| Presentation | Controller分割、DTO/Transformer分離 |
| Frontend | コンポーネント分割、カスタムHook抽出 |

### 1.4 例外

以下の場合は500行超過を許容：

- 自動生成ファイル（マイグレーション、型定義等）
- 設定ファイル
- テストファイル（ただし1000行を上限とする）

## 2. アーキテクチャ選定戦略

### 2.1 優先順位（Decision Tree）

1. **Project Definition (最優先)**: 設計書に明記されたアーキテクチャ
2. **Framework Convention**: フレームワークが構造を規定している場合はそれに従う
3. **Recommended Patterns**: 上記に該当しない場合、標準パターンを採用

### 2.2 推奨パターン

| 領域/規模 | 推奨パターン | 備考 |
|-----------|------------|------|
| **Backend (Simple)** | Layered (Controller-Service-Repository) | 一般的なWeb API |
| **Backend (Complex)** | Onion Architecture + DDD | ビジネスロジックが複雑な場合 |
| **Frontend (App)** | Framework Standard | フレームワーク推奨に従う |
| **Frontend (Component)** | Atomic Design | 大規模なUIコンポーネント設計時 |
| **Script/Tool** | Single File / Module based | 過剰なレイヤー化は禁止 |

## 3. 設計原則

### 3.1 SOLID原則

| 原則 | 説明 | チェック項目 |
|------|------|-------------|
| **S**ingle Responsibility | 単一責任 | 各クラス・関数は1つの責務のみ |
| **O**pen/Closed | 開放閉鎖 | 拡張に開き、修正に閉じている |
| **L**iskov Substitution | リスコフ置換 | サブタイプは親を代替可能 |
| **I**nterface Segregation | インターフェース分離 | 必要なインターフェースのみ実装 |
| **D**ependency Inversion | 依存性逆転 | 抽象に依存、具象に依存しない |

### 3.2 その他の原則

| 原則 | 説明 |
|------|------|
| DRY | Don't Repeat Yourself（重複を避ける） |
| YAGNI | You Aren't Gonna Need It（必要になるまで作らない） |
| KISS | Keep It Simple, Stupid（シンプルに保つ） |

## 4. 命名規則

### 4.1 共通

| 対象 | 規則 | 例 |
|------|------|-----|
| ファイル名 | kebab-case | `user-repository.ts` |
| ディレクトリ名 | kebab-case | `use-cases/` |
| 定数 | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |

### 4.2 バックエンド

| 対象 | 規則 | 例 |
|------|------|-----|
| クラス名 | PascalCase | `UserRepository` |
| メソッド名 | camelCase | `findById()` |
| テーブル名 | snake_case, 複数形 | `users` |

### 4.3 フロントエンド

| 対象 | 規則 | 例 |
|------|------|-----|
| コンポーネント | PascalCase | `UserCard.tsx` |
| カスタムHook | camelCase, use接頭辞 | `useAuth()` |
| イベントハンドラ | handle接頭辞 | `handleClick` |

## 5. テストカバレッジ要件

| 対象 | 閾値 |
|------|------|
| 新規コード | **80%以上** |
| 全体 | 70%以上（推奨） |

### テストの種類

| 種類 | 対象 | 優先度 |
|------|------|--------|
| Unit Test | ドメインロジック、ユーティリティ | 高 |
| Integration Test | API、DB連携 | 高 |
| E2E Test | ユーザーシナリオ | 中 |

## 6. 禁止事項

### 6.1 絶対禁止

| 禁止事項 | 理由 |
|---------|------|
| `any` 型の使用（TypeScript） | 型安全性の破壊 |
| `@ts-ignore` / `@ts-expect-error` | 型エラーの隠蔽 |
| 空のcatchブロック `catch(e) {}` | エラーの握りつぶし |
| 機密情報のハードコード | セキュリティリスク |
| `console.log` の本番コード残存 | デバッグコードの漏洩 |
| テスト削除による「修正」 | 品質の低下 |
| `todo!`, `unimplemented!` の残存 | 実装漏れ |

### 6.2 原則禁止（例外要申請）

| 禁止事項 | 例外条件 |
|---------|---------|
| 新規依存パッケージの追加 | 既存で代替不可の場合のみ |
| グローバル状態の使用 | 明確な理由がある場合のみ |
| 直接DOM操作（React/Vue） | パフォーマンス上必要な場合のみ |
