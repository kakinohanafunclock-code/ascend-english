# SPEC — 全体仕様

## 1. 目的
TOEFL iBT 105+（米大学・MBA 進学）を目標に、4技能（Reading / Listening / Speaking / Writing）を
AI が先生役として指導する、ブラウザ完結の学習 Web アプリ。

## 2. 画面構成
1. **オンボーディング / 診断** — 4技能 各数問のレベル診断 → 推定 TOEFL スコアレンジ → カリキュラム起点決定。
2. **ダッシュボード** — 4技能スコア推移、学習時間、連続学習日数(ストリーク)、目標到達 推定時間 vs 実績ギャップ。
3. **今日のタスク** — 30分枠の日次タスク一覧（カリキュラムから生成）。
4. **Reading** — パッセージ + 設問 + 精読解説（AI）。
5. **Listening** — 本文を TTS で音声化 + 設問。
6. **Speaking** — お題 → 録音/音声認識(STT) → AI 添削（内容・構成・文法）。
7. **Writing** — Independent / Integrated → AI がスコア目安と改善点を添削。
8. **設定** — 通知時刻、目標スコア、AI モード、データ管理。

## 3. データモデル（永続化キー）
- `profile` — `{ goalScore: number; createdAt: string; diagnostic: SkillScores; estimatedToefl: SkillScores; }`
- `attempts[]` — 1 設問/タスクの結果 `{ id, skill, taskId, correct?, accuracy?, durationMin, score?, at }`
- `sessions[]` — 学習セッション `{ date(YYYY-MM-DD), minutes, skills[] }`
- `settings` — `{ reminderTime: "HH:mm", reminderEnabled: boolean, aiMode }`
- `aiCache` — `{ key(hash): string -> { response, at } }`
- `curriculum` — 生成済み週次/日次プラン

### 型
```ts
type Skill = 'reading' | 'listening' | 'speaking' | 'writing';
type SkillScores = Record<Skill, number>; // 各 0–30
```

## 4. ドメインロジック
- **scoring** — 診断回答 → 各技能 0–30 推定、合計 0–120、信頼区間（レンジ）。
- **curriculum** — 目標(105+)と診断から、弱点重み付けで週次計画 → 1日30分の単位タスクへ分解。
- **difficulty** — 直近正答率で難易度 (1–5) を上下（>80%で+1, <50%で-1, ヒステリシス付き）。
- **studyTime** — 日次/週次集計、連続学習日数(ストリーク)算出。
- **gap** — 目標到達に必要な推定総学習時間 − 実績時間 = ギャップ、達成予測日。

## 5. AI 設計（Claude API）
- 用途を限定: `correctWriting`, `correctSpeaking`, `explainReading`, `generateCurriculum`。
- 既定モデルは安価モデル。プロンプト+モデルのハッシュで応答をキャッシュ。
- 本番は `/api/ai` プロキシ関数経由（キー秘匿）。レスポンスは構造化 JSON を要求。
- 失敗時はリトライ(指数) → フォールバック（ローカル簡易採点/定型解説）。

### AI レスポンス契約（添削）
```ts
interface WritingFeedback {
  estimatedScore: number;       // 0–5 (TOEFL Writing rubric 目安)
  toeflScaled: number;          // 0–30 換算
  strengths: string[];
  improvements: string[];
  correctedText?: string;
  rubric: { taskResponse: number; coherence: number; languageUse: number };
}
```

## 6. 通知
- Service Worker 登録 → Notification 許可フロー → 設定時刻に毎日ローカル通知。
- Push 鍵(VAPID)があれば Web Push 購読、無ければ SW のローカルスケジュールにフォールバック。

## 7. 非機能 / 制約
- 全アイコン SVG（lucide-react）。
- コスト 0 に近づける（音声=ブラウザ API、ホスティング/CI=無料枠）。
- テストファースト。CI グリーンが必須。
- /docs を常時最新化。
