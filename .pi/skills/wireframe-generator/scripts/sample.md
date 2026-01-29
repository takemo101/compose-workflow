# ワイヤーフレームサンプル集

このファイルには、サポートされているすべてのワイヤーフレームタイプのサンプルが含まれています。

## 基本タイプ

### ログイン画面 (form)

```yaml wireframe
screen: ログイン画面
type: form
title: ログイン
description: アカウントにログインしてください
fields:
  - name: email
    label: メールアドレス
    type: email
    required: true
    placeholder: example@example.com
  - name: password
    label: パスワード
    type: password
    required: true
  - name: remember
    label: ログイン状態を保持する
    type: checkbox
buttons:
  - label: ログイン
    variant: primary
  - label: パスワードを忘れた方
    variant: link
```

### ユーザー一覧 (table)

```yaml wireframe
screen: ユーザー一覧
type: table
title: ユーザー管理
columns:
  - name: name
    label: 名前
  - name: email
    label: メールアドレス
  - name: role
    label: 権限
    type: badge
  - name: status
    label: ステータス
    type: badge
  - name: createdAt
    label: 登録日
    type: date
actions:
  - search
  - create-button
  - pagination
  - row-edit
  - row-delete
data:
  - name: 山田太郎
    email: yamada@example.com
    role: 管理者
    status: アクティブ
    createdAt: 2024-01-15
  - name: 鈴木花子
    email: suzuki@example.com
    role: ユーザー
    status: アクティブ
    createdAt: 2024-01-20
  - name: 田中次郎
    email: tanaka@example.com
    role: ユーザー
    status: 停止中
    createdAt: 2024-02-01
```

### ユーザー詳細 (detail)

```yaml wireframe
screen: ユーザー詳細
type: detail
title: ユーザー詳細
subtitle: yamada@example.com
avatar:
  name: 山田太郎
sections:
  - title: 基本情報
    fields:
      - label: 名前
        value: 山田太郎
      - label: メールアドレス
        value: yamada@example.com
        type: link
      - label: 権限
        value: 管理者
        type: badge
      - label: ステータス
        value: アクティブ
        type: badge
  - title: アカウント情報
    fields:
      - label: 登録日
        value: 2024-01-15
        type: date
      - label: 最終ログイン
        value: 2024-01-28
        type: date
actions:
  - label: 編集
    variant: primary
    icon: edit
  - label: 削除
    variant: danger
    icon: delete
```

### 管理ダッシュボード (dashboard)

```yaml wireframe
screen: 管理ダッシュボード
type: dashboard
title: ダッシュボード
stats:
  - label: 総ユーザー数
    value: "1,234"
    icon: users
    trend: "+12%"
    trendDirection: up
    color: blue
  - label: 月間売上
    value: "¥5,678,000"
    icon: currency
    trend: "+8%"
    trendDirection: up
    color: green
  - label: アクティブセッション
    value: "89"
    icon: activity
    trend: "-3%"
    trendDirection: down
    color: yellow
  - label: 新規登録
    value: "45"
    icon: inbox
    trend: "+23%"
    trendDirection: up
    color: purple
widgets:
  - type: chart
    title: 売上推移
    chartType: line
  - type: table
    title: 最近の注文
    columns:
      - label: 注文ID
      - label: 顧客
      - label: 金額
```

## 新規タイプ

### タブ付き画面 (tabs)

```yaml wireframe
screen: タブ付き画面
type: tabs
title: プロジェクト詳細
variant: enclosed
tabs:
  - label: 概要
    icon: home
    content:
      type: detail
      config:
        sections:
          - title: プロジェクト情報
            fields:
              - label: プロジェクト名
                value: Eコマースリニューアル
              - label: ステータス
                value: 進行中
                type: badge
              - label: 開始日
                value: 2024-01-01
                type: date
  - label: タスク
    icon: check
    badge: 12
    content:
      type: table
      config:
        columns:
          - name: title
            label: タスク名
          - name: status
            label: ステータス
            type: badge
          - name: assignee
            label: 担当者
  - label: ファイル
    icon: folder
    badge: 5
    content:
      type: empty-state
      config:
        icon: folder
        title: ファイルがありません
        description: ファイルをアップロードしてください
```

### カードグリッド (card-grid)

```yaml wireframe
screen: 商品一覧
type: card-grid
title: 商品カタログ
description: 人気商品をチェック
columns: 3
actions:
  - label: 商品を追加
    variant: primary
    icon: plus
cards:
  - title: プレミアムプラン
    subtitle: 月額 ¥9,800
    description: すべての機能が使い放題のプレミアムプランです。
    badge:
      label: 人気
      color: red
    stats:
      - label: 利用者
        value: "1,234"
      - label: 評価
        value: "4.8"
    actions:
      - label: 詳細を見る
        variant: primary
      - label: 購入
        variant: ghost
  - title: スタンダードプラン
    subtitle: 月額 ¥4,980
    description: 基本機能を使えるスタンダードプランです。
    stats:
      - label: 利用者
        value: "5,678"
      - label: 評価
        value: "4.5"
    actions:
      - label: 詳細を見る
        variant: primary
  - title: フリープラン
    subtitle: 無料
    description: 無料で試せるフリープランです。
    badge:
      label: 無料
      color: green
    actions:
      - label: 詳細を見る
        variant: outline
```

### ウィザード (wizard)

```yaml wireframe
screen: アカウント設定ウィザード
type: wizard
title: アカウント設定
description: 3つのステップでアカウント設定を完了します
currentStep: 1
steps:
  - title: 基本情報
    description: お名前と連絡先
    fields:
      - name: name
        label: お名前
        type: text
        required: true
      - name: email
        label: メールアドレス
        type: email
        required: true
  - title: プロフィール
    description: プロフィール情報
    fields:
      - name: bio
        label: 自己紹介
        type: textarea
        rows: 4
      - name: avatar
        label: プロフィール画像
        type: file
        accept: image/*
  - title: 確認
    description: 設定内容の確認
    optional: false
```

### 空状態 (empty-state)

```yaml wireframe
screen: 検索結果なし
type: empty-state
variant: no-results
icon: search
title: 検索結果が見つかりません
description: 検索条件を変更して再度お試しください。
actions:
  - label: 条件をクリア
    variant: primary
  - label: ヘルプ
    variant: ghost
```

### 確認ダイアログ (confirm)

```yaml wireframe
screen: 削除確認
type: confirm
variant: danger
title: ユーザーを削除しますか？
message: この操作は取り消せません。ユーザー「山田太郎」を削除してもよろしいですか？
confirmLabel: 削除する
cancelLabel: キャンセル
```

### タイムライン (timeline)

```yaml wireframe
screen: アクティビティ履歴
type: timeline
title: 最近のアクティビティ
items:
  - title: プロジェクトが作成されました
    description: 新しいプロジェクト「Eコマースリニューアル」が作成されました
    timestamp: 2024-01-28 10:30
    icon: plus
    color: blue
    user:
      name: 山田太郎
  - title: タスクが完了しました
    description: 「要件定義」タスクが完了しました
    timestamp: 2024-01-27 15:45
    icon: check
    color: green
    user:
      name: 鈴木花子
  - title: コメントが追加されました
    description: デザインレビューにコメントが追加されました
    timestamp: 2024-01-26 09:00
    icon: mail
    color: purple
```

### 料金プラン (pricing)

```yaml wireframe
screen: 料金プラン
type: pricing
title: シンプルな料金体系
description: あなたのビジネスに最適なプランをお選びください
billingToggle: true
plans:
  - name: Starter
    description: 個人・小規模チーム向け
    price: "¥0"
    period: 月
    features:
      - label: ユーザー数 3名まで
        included: true
      - label: ストレージ 1GB
        included: true
      - label: 基本サポート
        included: true
      - label: API アクセス
        included: false
      - label: カスタムドメイン
        included: false
    action:
      label: 無料で始める
      variant: outline
  - name: Professional
    description: 成長中のチーム向け
    price: "¥2,980"
    period: 月
    featured: true
    badge: おすすめ
    features:
      - label: ユーザー数 無制限
        included: true
      - label: ストレージ 100GB
        included: true
      - label: 優先サポート
        included: true
      - label: API アクセス
        included: true
      - label: カスタムドメイン
        included: false
    action:
      label: 今すぐ始める
      variant: primary
  - name: Enterprise
    description: 大規模組織向け
    price: お問い合わせ
    features:
      - label: ユーザー数 無制限
        included: true
      - label: ストレージ 無制限
        included: true
      - label: 専任サポート
        included: true
      - label: API アクセス
        included: true
      - label: カスタムドメイン
        included: true
    action:
      label: 営業に連絡
      variant: outline
```

### FAQ (faq)

```yaml wireframe
screen: よくある質問
type: faq
title: よくある質問
description: お客様からよく寄せられる質問をまとめました
searchable: true
categorized: true
items:
  - question: 無料トライアルはありますか？
    answer: はい、14日間の無料トライアルをご用意しています。クレジットカードの登録は不要です。
    category: 料金
  - question: 支払い方法は何がありますか？
    answer: クレジットカード（Visa、Mastercard、JCB）、銀行振込、請求書払いに対応しています。
    category: 料金
  - question: データのバックアップはどうなっていますか？
    answer: データは毎日自動的にバックアップされ、30日間保持されます。
    category: セキュリティ
  - question: 解約したい場合はどうすればいいですか？
    answer: 設定画面からいつでも解約できます。解約後も月末まではサービスをご利用いただけます。
    category: アカウント
```

### ヒーロー (hero)

```yaml wireframe
screen: ランディングページ
type: hero
variant: centered
title: 次世代のプロジェクト管理ツール
subtitle: Project Hub
description: チームの生産性を最大化する、シンプルで強力なプロジェクト管理ソリューション。今すぐ無料で始めましょう。
actions:
  - label: 無料で始める
    variant: primary
    icon: arrow-right
  - label: デモを見る
    variant: outline
features:
  - icon: chart
    title: リアルタイム分析
    description: プロジェクトの進捗をリアルタイムで可視化
  - icon: users
    title: チームコラボレーション
    description: シームレスなチームワークを実現
  - icon: lock
    title: エンタープライズセキュリティ
    description: 業界最高水準のセキュリティ
```

### カンバン (kanban)

```yaml wireframe
screen: タスクボード
type: kanban
title: スプリント #42
columns:
  - id: todo
    title: To Do
    color: gray
    cards:
      - id: task-1
        title: ログイン画面のデザイン修正
        description: ユーザーフィードバックに基づいてログイン画面を改善
        labels:
          - label: デザイン
            color: "#805AD5"
        assignee:
          name: 鈴木花子
        dueDate: 1/30
        comments: 3
      - id: task-2
        title: API エンドポイントの追加
        labels:
          - label: バックエンド
            color: "#38A169"
        dueDate: 2/1
  - id: in-progress
    title: In Progress
    color: blue
    limit: 3
    cards:
      - id: task-3
        title: ユーザー認証機能の実装
        description: JWT認証を使用したログイン機能
        labels:
          - label: 機能
            color: "#3182CE"
          - label: 優先度高
            color: "#E53E3E"
        assignee:
          name: 山田太郎
        comments: 5
        attachments: 2
  - id: done
    title: Done
    color: green
    cards:
      - id: task-4
        title: データベース設計
        labels:
          - label: インフラ
            color: "#DD6B20"
        assignee:
          name: 田中次郎
```

### カレンダー (calendar)

```yaml wireframe
screen: イベントカレンダー
type: calendar
title: スケジュール
view: month
events:
  - title: チームミーティング
    start: "2026-01-13"
    color: blue
  - title: リリース日
    start: "2026-01-20"
    color: green
  - title: 期限
    start: "2026-01-25"
    color: red
  - title: 休暇
    start: "2026-01-28"
    end: "2026-01-30"
    color: purple
actions:
  - label: イベント追加
    variant: primary
    icon: plus
```

### チャット (chat)

```yaml wireframe
screen: チャット画面
type: chat
participants:
  - name: 鈴木花子
    status: online
messages:
  - id: msg-1
    content: プロジェクトの進捗について確認したいのですが、今お時間ありますか？
    sender:
      name: 鈴木花子
    timestamp: 10:30
    isOwn: false
  - id: msg-2
    content: はい、大丈夫です！何でも聞いてください。
    sender:
      name: 自分
    timestamp: 10:32
    isOwn: true
    status: read
  - id: msg-3
    content: ありがとうございます。認証機能の実装はどのくらい進んでいますか？
    sender:
      name: 鈴木花子
    timestamp: 10:33
    isOwn: false
  - id: msg-4
    content: 80%くらい完了しています。今週中には終わる予定です。
    sender:
      name: 自分
    timestamp: 10:35
    isOwn: true
    status: delivered
```

### プロフィール (profile)

```yaml wireframe
screen: ユーザープロフィール
type: profile
user:
  name: 山田太郎
  title: シニアエンジニア
  bio: フルスタックエンジニアとして10年以上の経験があります。React、Node.js、TypeScriptを得意としています。
  stats:
    - label: プロジェクト
      value: "42"
    - label: フォロワー
      value: "1,234"
    - label: フォロー中
      value: "567"
  social:
    - platform: github
      url: https://github.com
    - platform: twitter
      url: https://twitter.com
    - platform: linkedin
      url: https://linkedin.com
actions:
  - label: フォローする
    variant: primary
  - label: メッセージ
    variant: outline
tabs:
  - label: 投稿
    content:
      type: empty-state
      config:
        icon: inbox
        title: まだ投稿がありません
  - label: プロジェクト
    content:
      type: card-grid
      config:
        columns: 2
        cards:
          - title: Eコマースサイト
            description: Next.js + Prisma
          - title: 管理画面
            description: React + TypeScript
```

### 認証画面 (auth)

```yaml wireframe
screen: 新規登録
type: auth
variant: register
logo:
  text: MyApp
title: アカウントを作成
description: 無料で始めましょう
socialProviders:
  - google
  - github
fields:
  - name: name
    label: お名前
    type: text
    required: true
    placeholder: 山田太郎
  - name: email
    label: メールアドレス
    type: email
    required: true
    placeholder: example@example.com
  - name: password
    label: パスワード
    type: password
    required: true
    helperText: 8文字以上
  - name: terms
    label: 利用規約に同意する
    type: checkbox
    required: true
submitLabel: アカウントを作成
links:
  - label: すでにアカウントをお持ちの方はこちら
    href: /login
footer: 登録することで、利用規約とプライバシーポリシーに同意したものとみなされます。
```

### 設定画面 (settings)

```yaml wireframe
screen: アカウント設定
type: settings
title: 設定
description: アカウントとアプリケーションの設定を管理します
sidebar:
  - label: プロフィール
  - label: セキュリティ
  - label: 通知
  - label: 外観
sections:
  - title: プロフィール設定
    description: 公開プロフィール情報を管理します
    fields:
      - name: name
        label: 表示名
        type: text
        placeholder: 山田太郎
      - name: email
        label: メールアドレス
        type: email
        placeholder: example@example.com
      - name: bio
        label: 自己紹介
        type: textarea
        rows: 3
  - title: 通知設定
    description: 通知の受信方法を設定します
    fields:
      - name: emailNotify
        label: メール通知を受け取る
        type: checkbox
      - name: pushNotify
        label: プッシュ通知を受け取る
        type: checkbox
```
