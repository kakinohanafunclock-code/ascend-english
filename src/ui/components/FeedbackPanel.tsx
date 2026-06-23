import { Sparkles, ThumbsUp, ArrowUpRight, CircuitBoard } from 'lucide-react';

export interface RubricRow {
  label: string;
  value: number; // 0–5
}

export function FeedbackPanel({
  toeflScaled,
  rubric,
  strengths,
  improvements,
  correctedText,
  source,
}: {
  toeflScaled: number;
  rubric: RubricRow[];
  strengths: string[];
  improvements: string[];
  correctedText?: string;
  source: 'ai' | 'fallback';
}) {
  return (
    <div className="card card-pad flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-accent" />
          <h3 className="text-h2 font-semibold">AI 添削</h3>
        </div>
        <span className="tag">
          {source === 'ai' ? (
            <>
              <Sparkles size={12} /> Claude
            </>
          ) : (
            <>
              <CircuitBoard size={12} /> ローカル簡易採点
            </>
          )}
        </span>
      </div>

      <div className="flex items-end gap-3">
        <span className="text-display font-semibold tabular-nums leading-none">{toeflScaled}</span>
        <span className="text-ink-muted text-small mb-1">/ 30 換算スコア目安</span>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        {rubric.map((r) => (
          <div key={r.label} className="rounded-token border border-line p-3">
            <div className="text-micro text-ink-subtle mb-1">{r.label}</div>
            <div className="flex items-center gap-2">
              <span className="font-medium tabular-nums">{r.value.toFixed(1)}</span>
              <div className="flex-1 h-1.5 rounded-full bg-canvas border border-line overflow-hidden">
                <div className="h-full bg-accent" style={{ width: `${(r.value / 5) * 100}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {strengths.length > 0 && (
        <div>
          <p className="text-small font-medium mb-2 flex items-center gap-1.5">
            <ThumbsUp size={14} className="text-positive" /> 良い点
          </p>
          <ul className="flex flex-col gap-1.5">
            {strengths.map((s, i) => (
              <li key={i} className="text-small text-ink-muted pl-4 relative">
                <span className="absolute left-0 text-ink-subtle">·</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {improvements.length > 0 && (
        <div>
          <p className="text-small font-medium mb-2 flex items-center gap-1.5">
            <ArrowUpRight size={14} className="text-warning" /> 改善点
          </p>
          <ul className="flex flex-col gap-1.5">
            {improvements.map((s, i) => (
              <li key={i} className="text-small text-ink-muted pl-4 relative">
                <span className="absolute left-0 text-ink-subtle">·</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {correctedText && (
        <div>
          <p className="text-small font-medium mb-2">添削後の例</p>
          <p className="text-small text-ink-muted whitespace-pre-wrap border-l-2 border-line pl-3">
            {correctedText}
          </p>
        </div>
      )}
    </div>
  );
}
