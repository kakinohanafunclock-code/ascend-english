import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, ArrowRight } from 'lucide-react';
import { Quiz, type QuizResult } from '../components/Quiz';
import { ScoreBar } from '../components/Charts';
import { DIAGNOSTIC } from '../../content';
import { itemsToAnswers } from '../lib/record';
import { estimateSkillScores, estimateToefl, SKILLS, SKILL_LABELS } from '../../domain';
import { useApp } from '../../app/store';

export function Diagnostic() {
  const { completeDiagnostic, settings } = useApp();
  const navigate = useNavigate();
  const [result, setResult] = useState<QuizResult | null>(null);
  const [starting, setStarting] = useState(false);

  if (!result) {
    return (
      <div className="max-w-2xl">
        <div className="card card-pad mb-6">
          <span className="grid place-items-center w-10 h-10 rounded-token bg-accent-soft text-accent mb-4">
            <GraduationCap size={20} />
          </span>
          <h2 className="text-h2 font-semibold mb-1">レベル診断</h2>
          <p className="text-ink-muted text-small">
            4技能の短い設問に答えると、推定 TOEFL スコアと、目標
            {' '}
            {settings.goalScore}+ に向けた学習プランを作成します。所要約5分。
          </p>
        </div>
        <Quiz questions={DIAGNOSTIC} onComplete={setResult} submitLabel="診断する" continueLabel="結果を見る" />
      </div>
    );
  }

  const answers = itemsToAnswers(result.items);
  const sections = estimateSkillScores(answers);
  const toefl = estimateToefl(sections);

  async function start() {
    setStarting(true);
    await completeDiagnostic(answers);
    navigate('/dashboard');
  }

  return (
    <div className="max-w-2xl">
      <div className="card card-pad mb-6">
        <span className="eyebrow">推定スコア</span>
        <div className="flex items-end gap-3 mt-2 mb-1">
          <span className="text-display font-semibold tabular-nums leading-none">{toefl.total}</span>
          <span className="text-ink-muted text-small mb-1">/ 120（範囲 {toefl.low}–{toefl.high}）</span>
        </div>
        <p className="text-small text-ink-muted">目標 {settings.goalScore}+ までの学習プランを生成します。</p>
      </div>

      <div className="card card-pad mb-6 flex flex-col gap-4">
        {SKILLS.map((s) => (
          <ScoreBar key={s} label={SKILL_LABELS[s]} score={sections[s].score} goal={Math.round(settings.goalScore / 4)} />
        ))}
      </div>

      <button className="btn-primary" onClick={start} disabled={starting}>
        {starting ? '作成中…' : 'この内容で学習を始める'}
        <ArrowRight size={16} />
      </button>
    </div>
  );
}
