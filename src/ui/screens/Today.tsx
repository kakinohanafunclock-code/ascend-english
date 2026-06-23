import { Link } from 'react-router-dom';
import { BookOpen, Headphones, Mic, PenLine, Clock, ArrowRight } from 'lucide-react';
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
  const { curriculum } = useApp();

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

      <ol className="flex flex-col gap-3">
        {tasks.map((t, i) => {
          const Icon = SKILL_ICON[t.skill];
          return (
            <li key={t.id}>
              <Link
                to={`/${t.skill}`}
                className="card card-pad flex items-center gap-4 hover:border-line-strong transition-colors"
              >
                <span className="grid place-items-center w-9 h-9 rounded-token bg-accent-soft text-accent shrink-0">
                  <Icon size={18} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-micro text-ink-subtle">STEP {i + 1} · 難易度 {t.difficulty}</p>
                  <p className="font-medium truncate">{t.title}</p>
                </div>
                <span className="text-small text-ink-muted whitespace-nowrap">{t.estimatedMinutes}分</span>
                <ArrowRight size={16} className="text-ink-subtle" />
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
