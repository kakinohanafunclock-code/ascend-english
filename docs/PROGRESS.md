# PROGRESS

## 完了
- ステップ1: プロジェクト雛形（Vite+React+TS+Tailwind+Vitest+Playwright）。`npm run build` 成功、tsc クリーン。
- ステップ2: ドメインロジック TDD（scoring / curriculum / difficulty / studyTime / gap）— 37 tests green。
- ステップ3: 永続化（IndexedDB / localStorage / memory の KV + Repository）— 8 tests green。
- ステップ4: AI 連携層（Claude ラッパー・キャッシュ・リトライ・コスト上限・添削/解説 + ローカルフォールバック）— 15 tests green。

## 進行中
- ステップ5: UI（診断 / 4技能 / ダッシュボード / 設定）。

## 残タスク
- ステップ5: UI（診断 / 4技能 / ダッシュボード / 設定）。
- ステップ6: 通知（SW 登録・Push・定刻スケジュール）+ 実機許可フロー確認。
- ステップ7: E2E（Playwright）。
- ステップ8: CI（GitHub Actions）。
- ステップ9: デプロイ設定（Vercel/Netlify）+ README。

## 既知の課題 / 留意点
- TOEFL 公式スコアリングは非公開のため近似アルゴリズムを使用（DECISIONS 参照）。
- Web Speech API STT は Chrome 系に依存。非対応環境はテキスト入力にフォールバック予定。
