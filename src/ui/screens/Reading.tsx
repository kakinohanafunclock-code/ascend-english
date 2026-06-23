import { useState } from 'react';
import { Sparkles, Loader2, Languages, Plus, Check } from 'lucide-react';
import { useApp } from '../../app/store';
import { Quiz, type QuizResult } from '../components/Quiz';
import { READING_LESSONS } from '../../content';
import { explainReading, type ReadingExplanation } from '../../ai';
import { hasTerm } from '../../domain';
import { makeAttempt, sectionScoreFromItems } from '../lib/record';

export function Reading() {
  const { ai, recordAttempt, vocab, addVocabWord } = useApp();
  const lesson = READING_LESSONS[0];
  const [done, setDone] = useState<QuizResult | null>(null);
  const [explanation, setExplanation] = useState<ReadingExplanation | null>(null);
  const [loading, setLoading] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);

  async function onComplete(result: QuizResult) {
    setDone(result);
    await recordAttempt(
      makeAttempt({
        skill: 'reading',
        taskId: lesson.id,
        durationMin: lesson.estimatedMinutes,
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
        <button
          className="btn-ghost inline-flex w-auto mt-3 px-2"
          onClick={() => setShowTranslation((s) => !s)}
        >
          <Languages size={15} /> 日本語訳{showTranslation ? 'を隠す' : 'を表示'}
        </button>
        {showTranslation && (
          <p className="text-small text-ink-muted leading-relaxed mt-2 border-t border-line pt-3">
            {lesson.translationJa}
          </p>
        )}
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
              {explanation.translationJa && (
                <p className="text-small text-ink-muted leading-relaxed border-l-2 border-line pl-3">
                  {explanation.translationJa}
                </p>
              )}
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
                  <p className="text-micro text-ink-subtle mb-2">重要語彙（単語帳に追加できます）</p>
                  <ul className="flex flex-col gap-2">
                    {explanation.vocabulary.map((v, i) => {
                      const saved = hasTerm(vocab, v.term);
                      return (
                        <li
                          key={i}
                          className="flex items-center gap-3 rounded-token border border-line px-3 py-2"
                        >
                          <div className="flex-1 min-w-0 text-small">
                            <span className="font-medium">{v.term}</span>
                            <span className="text-ink-muted"> — {v.meaning}</span>
                          </div>
                          <button
                            className="btn-ghost inline-flex w-auto shrink-0 px-2 py-1"
                            disabled={saved}
                            aria-label={`${v.term} を単語帳に追加`}
                            onClick={() => addVocabWord(v)}
                          >
                            {saved ? <Check size={15} className="text-positive" /> : <Plus size={15} />}
                            <span className="text-micro">{saved ? '追加済' : '単語帳'}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
