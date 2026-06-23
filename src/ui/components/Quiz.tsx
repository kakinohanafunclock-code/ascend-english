import { useState } from 'react';
import { Check, X } from 'lucide-react';
import type { MCQuestion } from '../../content';

export interface QuizResultItem {
  question: MCQuestion;
  choiceIndex: number;
  correct: boolean;
}

export interface QuizResult {
  items: QuizResultItem[];
  correctCount: number;
  accuracy: number; // 0–1
}

export function Quiz({
  questions,
  onComplete,
  submitLabel = '採点する',
  continueLabel = '完了',
}: {
  questions: MCQuestion[];
  onComplete: (result: QuizResult) => void;
  submitLabel?: string;
  continueLabel?: string;
}) {
  const [choices, setChoices] = useState<Record<string, number>>({});
  const [graded, setGraded] = useState(false);

  const allAnswered = questions.every((q) => choices[q.id] != null);

  function grade() {
    setGraded(true);
  }

  function buildResult(): QuizResult {
    const items: QuizResultItem[] = questions.map((q) => ({
      question: q,
      choiceIndex: choices[q.id],
      correct: choices[q.id] === q.answerIndex,
    }));
    const correctCount = items.filter((i) => i.correct).length;
    return { items, correctCount, accuracy: correctCount / questions.length };
  }

  return (
    <div className="flex flex-col gap-5">
      {questions.map((q, qi) => {
        const selected = choices[q.id];
        return (
          <div key={q.id} className="card card-pad">
            <p className="text-small text-ink-subtle mb-2">設問 {qi + 1}</p>
            <p className="font-medium mb-4">{q.prompt}</p>
            <div className="flex flex-col gap-2">
              {q.options.map((opt, oi) => {
                const isSelected = selected === oi;
                const isAnswer = q.answerIndex === oi;
                const showState = graded && (isSelected || isAnswer);
                return (
                  <button
                    key={oi}
                    type="button"
                    disabled={graded}
                    onClick={() => setChoices((c) => ({ ...c, [q.id]: oi }))}
                    className={[
                      'flex items-center gap-3 rounded-token border px-3 py-2.5 text-left text-small transition-colors',
                      graded
                        ? isAnswer
                          ? 'border-positive bg-[color:var(--color-accent-soft)]'
                          : isSelected
                            ? 'border-critical'
                            : 'border-line'
                        : isSelected
                          ? 'border-accent bg-accent-soft'
                          : 'border-line hover:border-line-strong',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'grid place-items-center w-5 h-5 rounded-full border text-micro shrink-0',
                        isSelected ? 'border-accent text-accent' : 'border-line-strong text-ink-subtle',
                      ].join(' ')}
                    >
                      {String.fromCharCode(65 + oi)}
                    </span>
                    <span className="flex-1">{opt}</span>
                    {showState &&
                      (isAnswer ? (
                        <Check size={16} className="text-positive" />
                      ) : isSelected ? (
                        <X size={16} className="text-critical" />
                      ) : null)}
                  </button>
                );
              })}
            </div>
            {graded && q.explanation && (
              <p className="text-small text-ink-muted mt-3 border-t border-line pt-3">
                {q.explanation}
              </p>
            )}
          </div>
        );
      })}

      {!graded ? (
        <button className="btn-primary self-start" disabled={!allAnswered} onClick={grade}>
          {submitLabel}
        </button>
      ) : (
        <button className="btn-primary self-start" onClick={() => onComplete(buildResult())}>
          {continueLabel}
        </button>
      )}
    </div>
  );
}
