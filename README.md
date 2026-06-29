# Ascend — TOEFL iBT 105+ 英語学習アプリ

4技能（Reading / Listening / Speaking / Writing）を AI が先生役として指導する、ブラウザ完結の英語学習 Web アプリ。
初回レベル診断 → カリキュラム自動生成 → 日次30分タスク → AI 添削 → ダッシュボード可視化 → 毎日リマインド を一気通貫で提供します。

落ち着いた高級 SaaS（Linear / Stripe 系）の白基調 UI。アイコンはすべて SVG（lucide-react）。

---

## 主な機能

- **初回レベル診断**: R/L/S/W 各設問 → 推定 TOEFL スコアレンジ算出 → カリキュラム起点を決定。
- **カリキュラム生成**: 目標 105+ と診断結果から、弱点重み付けで週次/日次プランを自動生成。1日30分枠に分解。
- **4技能モジュール**:
  - Reading: パッセージ + 設問 + AI 精読解説。
  - Listening: 本文を Web Speech API (TTS) で音声化 + 設問（音声ファイル無し＝コスト0）。
  - Speaking: お題 → 音声認識 (STT) → AI が内容・構成・文法を添削。
  - Writing: Independent / Integrated → AI がスコア目安と改善点を添削。
- **ダッシュボード**: 4技能スコア推移、学習時間、連続学習日数(ストリーク)、目標到達 推定時間 vs 実績ギャップを可視化。
- **毎日リマインド**: Service Worker + 通知 API で定刻リマインド。通知時刻設定 UI と許可フロー付き。
- **データ永続化**: IndexedDB（localStorage / メモリにフォールバック）。端末内のみ。
- **AI 連携**: Claude API（安価モデル既定）。添削・解説・カリキュラムなど高価値箇所に限定し、応答をキャッシュ。

---

## 技術構成

Vite 6 / React 18 / TypeScript(strict) / Tailwind CSS 3 / Vitest / Testing Library / Playwright / lucide-react。
詳細は [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)、仕様は [docs/SPEC.md](docs/SPEC.md)、設計判断は [docs/DECISIONS.md](docs/DECISIONS.md)。

---

## セットアップ

```bash
npm install
cp .env.example .env     # 必要に応じて編集（未設定でも動作：AI はローカル簡易採点にフォールバック）
npm run dev              # http://localhost:5173
```

### スクリプト

| コマンド | 内容 |
|----------|------|
| `npm run dev` | 開発サーバ |
| `npm run build` | 型チェック + 本番ビルド（`dist/`） |
| `npm run preview` | ビルド成果物のプレビュー |
| `npm test` | 単体・コンポーネントテスト（Vitest） |
| `npm run coverage` | カバレッジ計測 |
| `npm run e2e` | E2E テスト（Playwright、要 `npx playwright install`） |

---

## 環境変数

`.env`（コミット禁止。`.gitignore` 済み）。

| 変数 | 用途 | 既定 |
|------|------|------|
| `VITE_CLAUDE_MODEL` | 使用モデル（安価モデル推奨） | `claude-haiku-4-5-20251001` |
| `VITE_AI_MODE` | `proxy`（本番推奨）/ `direct`（ローカル検証のみ） | `proxy` |
| `VITE_AI_PROXY_URL` | proxy エンドポイント | `/api/ai` |
| `VITE_CLAUDE_API_KEY` | direct モード時のみ（本番禁止） | — |
| `CLAUDE_API_KEY` | **サーバ側**（proxy 関数）で参照。フロントに露出しない | — |

> **キー管理**: 本番は必ず `proxy` モード。`CLAUDE_API_KEY` はホスティングの環境変数に設定し、サーバ関数（[api/ai.ts](api/ai.ts) / [netlify/functions/ai.mts](netlify/functions/ai.mts)）経由で呼び出します。ブラウザにキーを置きません。AI 未設定でもアプリは動作し、添削はローカル簡易採点にフォールバックします。

---

## クラウド同期 / Web Push（任意）

どちらも未設定でアプリは完全動作します（端末内保存＋アプリ稼働中のローカル通知）。必要に応じて有効化:

### Supabase クラウド同期（無料枠・端末間で共有）
1. Supabase プロジェクトを作成し、[supabase/schema.sql](supabase/schema.sql) を SQL エディタで実行。
2. `VITE_SUPABASE_URL`（プロジェクトURLのみ。`/rest/v1/` は付けない）/ `VITE_SUPABASE_ANON_KEY` を Vercel の環境変数（本番）または `.env`（ローカル）に設定 → 再デプロイ。
3. **端末間で共有する手順（同期コード方式・ログイン不要）**:
   - 1台目（例: PC）: 設定 → 「クラウド同期を有効にする」を ON。表示される**同期コード**（例 `ABCD-EFGH-JKLM`）を控える。
   - 2台目（例: スマホ）: 設定 → 「別の端末の同期コードを入力して連携」にそのコードを入力 →「連携して取り込む」。1台目のデータが取り込まれます。
   - 以降、各端末で「今すぐ同期」または起動時の自動取得で last-write-wins 同期。SDK は遅延読み込みで初期バンドルに含めません。
   - 注: コードを知っていれば誰でもそのデータにアクセスできます（簡易方式）。厳密な保護が必要なら Supabase Auth への移行を推奨。

### Web Push（端末を閉じていても通知）
1. `npx web-push generate-vapid-keys` で鍵を生成。
2. フロント: `VITE_VAPID_PUBLIC_KEY`。サーバ: `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` と `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`（購読保存用）。
3. 設定画面で「この端末をプッシュ登録」。配信は [api/push/send](api/push/send.ts) を Vercel Cron（[vercel.json](vercel.json) の `crons`）が叩いて全購読者へ送信します。
   - 注: Vercel Hobby（無料）は **Cron が1日1回まで** のため、既定は毎日1回配信（`0 11 * * *` = 11:00 UTC ≒ 20:00 JST）です。ユーザー個別の時刻厳密化は有料の毎時 Cron か外部スケジューラが必要（その場合 `send.ts` の時刻フィルタを再有効化）。確実な時刻指定の主経路はアプリ稼働中のローカルスケジュールです。

## デプロイ（無料枠）

### Vercel
1. リポジトリを import（[vercel.json](vercel.json) を自動認識）。
2. 環境変数 `CLAUDE_API_KEY` を設定。
3. デプロイ。`/api/ai` が AI プロキシ関数として動作。

### Netlify
1. リポジトリを連携（[netlify.toml](netlify.toml) を認識）。
2. 環境変数 `CLAUDE_API_KEY` を設定。
3. デプロイ。`netlify/functions/ai.mts` が `/api/ai` を提供。

いずれも静的ホスティング + サーバレス関数で **無料枠** に収まる構成です。

---

## テスト / CI

- テストファースト（TDD）。ドメインロジック・永続化・AI 層・UI・通知スケジュールに単体/コンポーネントテスト。
- E2E（Playwright）が「診断 → 日次タスク → Writing 添削 → ダッシュボード反映 → 通知設定」を実ブラウザで検証。
- [GitHub Actions](.github/workflows/ci.yml) が push / PR で typecheck・テスト・ビルド・E2E を自動実行。

```bash
npm test            # 単体・コンポーネント
npx playwright install --with-deps chromium
npm run e2e         # E2E
```

---

## 設計上の既定の選択（理由）

- **スコアリング**: TOEFL 公式アルゴリズムは非公開のため、難易度重み付き正答率に基づく**説明可能な近似**を採用（`abilityRatio × difficultyScale → 0–30`）。詳細は [docs/DECISIONS.md](docs/DECISIONS.md)。
- **音声**: コスト0のため Web Speech API（TTS/STT）のみ使用。未対応ブラウザ（主に STT）はテキスト入力にフォールバック。
- **必要学習時間**: 1点あたりの目安時間（既定 8h/点）を用いた近似。設定で目標スコアを変更可能。
- **永続化**: まず端末内（IndexedDB）。クラウド同期（Supabase 無料枠）は将来オプション。
- **アクセント色**: 紫/青の派手なグラデーションを避け、ink-teal 1色に限定。配色・余白・タイポは CSS 変数トークンで一元管理。

---

## ディレクトリ

```
src/domain/        純粋ドメインロジック（scoring / curriculum / difficulty / studyTime / gap）
src/data/          永続化（KV ストア + Repository）
src/ai/            Claude ラッパー・キャッシュ・添削/解説 + ローカルフォールバック
src/content/       問題コンテンツ（診断 / Reading / Listening / Speaking / Writing）
src/notifications/ Service Worker 登録・リマインドスケジュール
src/ui/            画面・コンポーネント（診断 / 4技能 / ダッシュボード / 設定）
src/app/           アプリ状態（Context store）・セレクタ
api/, netlify/     AI プロキシ（サーバレス関数）
docs/              SPEC / ARCHITECTURE / DECISIONS / PROGRESS
tests/e2e/         Playwright E2E
```
