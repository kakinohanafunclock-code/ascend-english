# DECISIONS — 設計判断ログ

追記形式。新しい決定を上に積む。

## 2026-06-23 — 初期技術選定とプロジェクト方針
- **決定**: Vite + React + TS(strict) + Tailwind + Vitest + Testing Library + Playwright を採用。
- **理由**: 要件で明示。Vite/Vitest は同一設定で dev/test を回せ TDD と相性が良い。
- **決定**: アクセント色は紫/青を避け、ink-teal (`#0f6e63`) 1色に限定。配色・余白・タイポは CSS 変数トークン化。
- **理由**: 「生成AIアプリっぽい」派手な見た目を禁止する要件。Linear/Stripe 系の抑えた品位を狙う。
- **決定**: 永続化はまず IndexedDB（localStorage フォールバック）。Supabase は将来オプション。
- **理由**: コスト0・オフライン動作。クラウド同期は必要時に追加。
- **決定**: 音声は Web Speech API (TTS/STT) のみ。音声ファイルは保持しない。
- **理由**: コスト0の要件。Listening は本文→TTS、Speaking は STT で実現。
- **決定**: AI は Claude の安価モデル（`claude-haiku-4-5` 既定）。本番は proxy 関数経由でキー秘匿、応答はキャッシュ。
- **理由**: コスト最小化とキー漏洩防止。ブラウザ直叩き(direct)はローカル検証限定。
- **決定**: スコアは TOEFL 各技能 0–30、合計 0–120 のレンジで推定し、診断は IRT 風の単純な加重で算出。
- **理由**: 公式アルゴリズムは非公開のため、説明可能で安定した近似を採用（README に明記）。
