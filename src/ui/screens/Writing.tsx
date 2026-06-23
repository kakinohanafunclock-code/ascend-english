import { useRef, useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { useApp } from '../../app/store';
import { WRITING_PROMPTS } from '../../content';
import { correctWriting, type WritingFeedback } from '../../ai';
import { FeedbackPanel } from '../components/FeedbackPanel';
import { makeAttempt } from '../lib/record';

export function Writing() {
  const { ai, recordAttempt } = useApp();
  const task = WRITING_PROMPTS[0];
  const startedAt = useRef(Date.now());
  const [essay, setEssay] = useState('');
  const [feedback, setFeedback] = useState<WritingFeedback | null>(null);
  const [loading, setLoading] = useState(false);

  const wordCount = essay.trim().split(/\s+/).filter(Boolean).length;

  async function submit() {
    setLoading(true);
    const fb = await correctWriting(ai, { prompt: task.prompt, essay, essayType: task.type });
    setFeedback(fb);
    setLoading(false);
    const minutes = Math.max(1, Math.round((Date.now() - startedAt.current) / 60000));
    await recordAttempt(
      makeAttempt({ skill: 'writing', taskId: task.id, durationMin: minutes, score: fb.toeflScaled }),
    );
  }

  return (
    <div className="max-w-2xl flex flex-col gap-6">
      <div className="card card-pad">
        <p className="eyebrow mb-1">Writing · {task.type} · 目標 {task.targetWords} words</p>
        <p className="font-medium mt-2">{task.prompt}</p>
      </div>

      <div className="card card-pad flex flex-col gap-3">
        <label className="field-label" htmlFor="essay">
          あなたのエッセイ
        </label>
        <textarea
          id="essay"
          className="input min-h-64 resize-y font-serif leading-relaxed"
          value={essay}
          onChange={(e) => setEssay(e.target.value)}
          placeholder="Write your response here…"
        />
        <div className="flex items-center justify-between">
          <span className={`text-small ${wordCount >= task.targetWords ? 'text-positive' : 'text-ink-subtle'}`}>
            {wordCount} / {task.targetWords} words
          </span>
          <button
            className="btn-primary inline-flex w-auto"
            onClick={submit}
            disabled={loading || wordCount < 20}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            AI 添削を受ける
          </button>
        </div>
      </div>

      {feedback && (
        <FeedbackPanel
          toeflScaled={feedback.toeflScaled}
          rubric={[
            { label: 'Task Response', value: feedback.rubric.taskResponse },
            { label: 'Coherence', value: feedback.rubric.coherence },
            { label: 'Language Use', value: feedback.rubric.languageUse },
          ]}
          strengths={feedback.strengths}
          improvements={feedback.improvements}
          correctedText={feedback.correctedText}
          source={feedback.source}
        />
      )}
    </div>
  );
}
