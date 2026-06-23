import { useRef, useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { useApp } from '../../app/store';
import { Quiz, type QuizResult } from '../components/Quiz';
import { READING_LESSONS } from '../../content';
import { explainReading, type ReadingExplanation } from '../../ai';
import { makeAttempt, sectionScoreFromItems } from '../lib/record';

export function Reading() {
  const { ai, recordAttempt } = useApp();
  const lesson = READING_LESSONS[0];
  const startedAt = useRef(Date.now());
  const [done, setDone] = useState<QuizResult | null>(null);
  const [explanation, setExplanation] = useState<ReadingExplanation | null>(null);
  const [loading, setLoading] = useState(false);

  async function onComplete(result: QuizResult) {
    setDone(result);
    const minutes = Math.max(1, Math.round((Date.now() - startedAt.current) / 60000));
    await recordAttempt(
      makeAttempt({
        skill: 'reading',
        taskId: lesson.id,
        durationMin: minutes,
        accuracy: result.accuracy,
        score: sectionScoreFromItems('reading', result.items),
      }),
    );
  }

  async function getExplanation() {
    setLoading(true);
    const ex = await explainReading(ai, {
      passage: lesson.passage,
      question: lesson.questions[0]?.prompt,
    });
    setExplanation(ex);
    setLoading(false);
  }

  return (
    <div className="max-w-2xl flex flex-col gap-6">
      <article className="card card-pad">
        <p className="eyebrow mb-1">Reading · 難易度 {lesson.difficulty}</p>
        <h2 className="text-h2 font-semibold mb-3">{lesson.title}</h2>
        <p className="font-serif text-[1.0625rem] leading-relaxed text-ink">{lesson.passage}</p>
      </article>

      <Quiz questions={lesson.questions} onComplete={onComplete} />

      {done && (
        <div className="flex flex-col gap-4">
          <div className="card card-pad flex items-center justify-between">
            <p className="text-small text-ink-muted">
              正答 {done.correctCount}/{done.items.length}
            </p>
            <button className="btn-primary inline-flex w-auto" onClick={getExplanation} disabled={loading}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              AI 精読解説
            </button>
          </div>

          {explanation && (
            <div className="card card-pad flex flex-col gap-3">
              <p className="text-small">{explanation.summary}</p>
              {explanation.keyPoints.length > 0 && (
                <ul className="flex flex-col gap-1.5">
                  {explanation.keyPoints.map((k, i) => (
                    <li key={i} className="text-small text-ink-muted pl-4 relative">
                      <span className="absolute left-0 text-ink-subtle">·</span>
                      {k}
                    </li>
                  ))}
                </ul>
              )}
              {explanation.vocabulary.length > 0 && (
                <div className="border-t border-line pt-3">
                  <p className="text-micro text-ink-subtle mb-2">重要語彙</p>
                  <dl className="grid sm:grid-cols-2 gap-2">
                    {explanation.vocabulary.map((v, i) => (
                      <div key={i} className="text-small">
                        <dt className="font-medium inline">{v.term}</dt>
                        <dd className="text-ink-muted inline"> — {v.meaning}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
