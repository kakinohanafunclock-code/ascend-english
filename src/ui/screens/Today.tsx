import { Link } from 'react-router-dom';
import {
  BookOpen,
  Headphones,
  Mic,
  PenLine,
  Clock,
  ArrowRight,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../../app/store';
import { todayISO } from '../../app/selectors';
import type { Skill, StudyTask } from '../../domain';

const SKILL_ICON: Record<Skill, typeof BookOpen> = {
  reading: BookOpen,
  listening: Headphones,
  speaking: Mic,
  writing: PenLine,
};

export function Today() {
  const { curriculum, attempts } = useApp();

  if (!curriculum) {
    return (
      <div className="card card-pad max-w-lg">
        <p className="text-ink-muted mb-4">学習プランがまだありません。</p>
        <Link to="/diagnostic" className="btn-primary inline-flex w-auto">
          診断してプランを作成 <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  const today = todayISO();
  const allDays = curriculum.weeks.flatMap((w) => w.days);
  const day = allDays.find((d) => d.dateISO === today) ?? allDays[0];
  const tasks: StudyTask[] = day.tasks;

  // A task counts as done when the user has completed that many attempts of its
  // skill today; with multiple same-skill tasks, the earlier ones fill first.
  const doneCountBySkill: Partial<Record<Skill, number>> = {};
  for (const a of attempts) {
    if (a.at.slice(0, 10) === today) {
      doneCountBySkill[a.skill] = (doneCountBySkill[a.skill] ?? 0) + 1;
    }
  }
  const seenBySkill: Partial<Record<Skill, number>> = {};
  const taskState = tasks.map((t) => {
    const seen = seenBySkill[t.skill] ?? 0;
    const done = seen < (doneCountBySkill[t.skill] ?? 0);
    seenBySkill[t.skill] = seen + 1;
    return { task: t, done };
  });

  const completed = taskState.filter((s) => s.done).length;
  const total = taskState.length;
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  const allDone = completed === total && total > 0;

  return (
    <div className="max-w-2xl flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="eyebrow">{today}</p>
          <h2 className="text-h2 font-semibold mt-1">本日の30分プラン</h2>
        </div>
        <span className="tag">
          <Clock size={12} /> 計 {day.totalMinutes}分
        </span>
      </div>

      {/* Progress summary */}
      <div className="card card-pad flex items-center gap-4">
        <div className="flex-1">
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-small font-medium">
              本日の進捗 {completed} / {total} 完了
            </span>
            <span className="text-small tabular-nums text-ink-muted">{pct}%</span>
          </div>
          <div className="h-2 rounded-full bg-canvas border border-line overflow-hidden">
            <div className="h-full bg-accent transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
        {allDone && (
          <span className="tag text-positive border-positive">
            <CheckCircle2 size={12} /> 本日完了
          </span>
        )}
      </div>

      <ol className="flex flex-col gap-3">
        {taskState.map(({ task: t, done }, i) => {
          const Icon = SKILL_ICON[t.skill];
          return (
            <li key={t.id}>
              <Link
                to={`/${t.skill}`}
                aria-label={`${t.title}${done ? '（完了）' : ''}`}
                className={[
                  'card card-pad flex items-center gap-4 transition-colors',
                  done
                    ? 'bg-accent-soft border-line hover:border-line-strong'
                    : 'hover:border-line-strong',
                ].join(' ')}
              >
                <span
                  className={[
                    'grid place-items-center w-9 h-9 rounded-token shrink-0',
                    done ? 'bg-positive text-white' : 'bg-accent-soft text-accent',
                  ].join(' ')}
                >
                  {done ? <CheckCircle2 size={18} /> : <Icon size={18} />}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-micro text-ink-subtle">
                    STEP {i + 1} · 難易度 {t.difficulty}
                  </p>
                  <p className={['font-medium truncate', done ? 'text-ink-muted' : ''].join(' ')}>
                    {t.title}
                  </p>
                </div>
                {done ? (
                  <span className="tag text-positive border-positive shrink-0">
                    <CheckCircle2 size={12} /> 完了
                  </span>
                ) : (
                  <span className="text-small text-ink-muted whitespace-nowrap">
                    {t.estimatedMinutes}分
                  </span>
                )}
                {done ? (
                  <RotateCcw size={16} className="text-ink-subtle shrink-0" />
                ) : (
                  <ArrowRight size={16} className="text-ink-subtle shrink-0" />
                )}
              </Link>
            </li>
          );
        })}
      </ol>
      {allDone && (
        <p className="text-small text-ink-muted">
          本日のタスクはすべて完了しました。お疲れさまでした。
        </p>
      )}
    </div>
  );
}
