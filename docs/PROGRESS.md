# PROGRESS

## 完了
- ステップ1: プロジェクト雛形（Vite+React+TS+Tailwind+Vitest+Playwright）。`npm run build` 成功、tsc クリーン。
- ステップ2: ドメインロジック TDD（scoring / curriculum / difficulty / studyTime / gap）— 37 tests green。
- ステップ3: 永続化（IndexedDB / localStorage / memory の KV + Repository）— 8 tests green。
- ステップ4: AI 連携層（Claude ラッパー・キャッシュ・リトライ・コスト上限・添削/解説 + ローカルフォールバック）— 15 tests green。
- ステップ5: UI（診断 / Today / Reading / Listening / Speaking / Writing / Dashboard / Settings）。SVG チャート、lucide アイコンのみ。コンポーネント/画面テスト 14 件。ブラウザで起動確認（エラー無し）。
- ステップ6: 通知（SW: push/notificationclick/offline、リマインドスケジュール、許可フロー UI、起動時自動スケジュール）— scheduling 5 tests green。
- ステップ7-9: E2E（Playwright 一気通貫）、CI（GitHub Actions）、デプロイ設定（Vercel/Netlify + AI proxy 関数）、README 作成。

## 検証結果（2026-06-23）
- 単体/コンポーネント: **79 tests green**（domain 37 / data 8 / ai 15 / ui 14 / notifications 5）。
- 型チェック `tsc --noEmit`: クリーン。本番ビルド `npm run build`: 成功。
- E2E（Playwright / Chromium）: 「診断 → 今日のタスク → Writing AI添削 → ダッシュボード反映 → 通知許可フロー/時刻設定」**1 test green**。

## 残タスク / 任意拡張
- 任意: Supabase 同期、コンテンツ拡充、Web Push 鍵(VAPID)設定、Listening/Reading の AI 解説キャッシュ拡張。

## 既知の課題 / 留意点
- TOEFL 公式スコアリングは非公開のため近似アルゴリズムを使用（DECISIONS 参照）。
- Web Speech API STT は Chrome 系に依存。非対応環境はテキスト入力にフォールバック（実装済み）。
- 端末を閉じている間の定刻通知は Web Push（VAPID 設定時）に依存。未設定時はアプリ/SW 稼働中のローカルスケジュールで通知。
