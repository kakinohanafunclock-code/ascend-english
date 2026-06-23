# ARCHITECTURE

## 技術構成

| 領域 | 採用 | 理由 |
|------|------|------|
| ビルド | Vite 6 | 高速な dev server / HMR、軽量設定 |
| UI | React 18 + TypeScript (strict) | 型安全、コンポーネント指向 |
| ルーティング | react-router-dom 6 | 標準的な SPA ルーティング |
| スタイル | Tailwind CSS 3 + CSS 変数トークン | デザイントークンを一元管理、全画面で一貫 |
| アイコン | lucide-react | すべて SVG。外部画像アイコン禁止の要件を満たす |
| 単体/結合テスト | Vitest + Testing Library + jsdom | Vite ネイティブ、高速、TDD に最適 |
| E2E | Playwright | 通知許可フローを含む実ブラウザ検証 |
| 永続化 | IndexedDB（localStorage フォールバック） | クラウド不要・コスト0。後で Supabase 同期を追加可能 |
| 音声 | Web Speech API (TTS/STT) | 音声ファイルを持たずコスト0 |
| AI | Claude API（安価モデル既定 + キャッシュ） | 添削・解説・カリキュラム生成の高価値箇所に限定 |
| 通知 | Service Worker + Notification/Push API | 毎日定刻リマインド |
| デプロイ | Vercel / Netlify 無料枠 | ホスティング・CI とも無料 |
| CI | GitHub Actions | テスト自動実行 |

## ディレクトリ構造

```
src/
  domain/        純粋なドメインロジック（副作用なし・テスト容易）
    scoring.ts        診断回答→TOEFLスコアレンジ推定
    curriculum.ts     目標と診断から週次/日次プラン生成（30分単位）
    difficulty.ts     正答率による難易度動的調整
    studyTime.ts      学習時間集計・連続学習日数(ストリーク)
    gap.ts            目標到達 推定時間 vs 実績 ギャップ
    types.ts          ドメイン型
  data/          永続化（IndexedDB/localStorage リポジトリ）
  ai/            Claude API ラッパー・キャッシュ・コスト抑制
  content/       Reading/Listening/Speaking/Writing の問題コンテンツ
  notifications/ Service Worker 登録・購読・スケジューリング
  ui/            画面・コンポーネント（診断/4技能/ダッシュボード/設定）
    components/   再利用 UI（Button, Card, Charts, Icon ラッパ 等）
  app/           アプリ状態（context/store）・ルーティング
public/
  sw.js          Service Worker
  manifest.webmanifest
tests/
  unit/          ドメイン/データ/AI の単体テスト
  e2e/           Playwright E2E
docs/            SPEC / ARCHITECTURE / DECISIONS / PROGRESS
api/             デプロイ先のサーバ関数（AI プロキシ）
```

## 設計原則
- ドメインロジックは副作用ゼロの純関数として実装し、UI/永続化から独立してテストする。
- AI 呼び出しは添削・解説・カリキュラム生成のみ。結果はキャッシュしトークンを節約。
- 設定値（配色・余白・タイポ）は CSS 変数 + Tailwind theme のトークンに集約。
- API キーは環境変数管理。本番はサーバ関数(proxy)経由でキーを秘匿。
