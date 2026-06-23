import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Clock, Target, TrendingUp, ArrowRight } from 'lucide-react';
import { useApp } from '../../app/store';
import { buildDashboard } from '../../app/selectors';
import { ScoreBar, StatCard, LineChart, ProgressRing } from '../components/Charts';
import { SKILLS, SKILL_LABELS } from '../../domain';

export function Dashboard() {
  const { profile, attempts, settings } = useApp();
  const model = useMemo(
    () => (profile ? buildDashboard(profile, attempts) : null),
    [profile, attempts],
  );

  if (!profile || !model) {
    return (
      <div className="card card-pad max-w-lg">
        <p className="text-ink-muted mb-4">まだ診断を受けていません。</p>
        <Link to="/diagnostic" className="btn-primary inline-flex w-auto">
          レベル診断を受ける <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  const { streak, totalMinutes, estimatedTotal, gap, currentSections, totalTrend } = model;
  const hours = Math.round((totalMinutes / 60) * 10) / 10;

  return (
    <div className="flex flex-col gap-6">
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="推定 TOEFL"
          value={estimatedTotal}
          sub={`目標 ${profile.goalScore}（残り ${Math.max(0, profile.goalScore - estimatedTotal)} 点）`}
          icon={<TrendingUp size={16} />}
        />
        <StatCard
          label="連続学習"
          value={`${streak}日`}
          sub={streak > 0 ? '継続中。素晴らしい。' : '今日から始めましょう'}
          icon={<Flame size={16} />}
        />
        <StatCard
          label="総学習時間"
          value={`${hours}h`}
          sub={`必要見込み ${gap.requiredHours}h`}
          icon={<Clock size={16} />}
        />
        <StatCard
          label="目標予測日"
          value={gap.projectedDate ?? '—'}
          sub={`達成度 ${gap.percentComplete}%`}
          icon={<Target size={16} />}
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        <div className="card card-pad">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-h2 font-semibold">スコア推移（推定合計）</h2>
            <span className="tag">0–120</span>
          </div>
          <LineChart series={[{ name: 'total', points: totalTrend }]} max={120} />
          <p className="text-small text-ink-subtle mt-2">
            学習を完了するたびに推定スコアが更新されます。
          </p>
        </div>

        <div className="card card-pad flex flex-col items-center justify-center">
          <h2 className="text-h2 font-semibold self-start mb-4">目標到達ギャップ</h2>
          <ProgressRing
            percent={gap.percentComplete}
            size={140}
            label={
              <div>
                <div className="text-h1 font-semibold tabular-nums">{gap.percentComplete}%</div>
                <div className="text-micro text-ink-subtle">時間ベース達成度</div>
              </div>
            }
          />
          <p className="text-small text-ink-muted mt-4 text-center">
            残り <span className="font-medium text-ink">{gap.remainingHours}h</span>
            {' '}（実績 {hours}h / 必要 {gap.requiredHours}h）
          </p>
        </div>
      </section>

      <section className="card card-pad">
        <h2 className="text-h2 font-semibold mb-4">技能別スコア</h2>
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
          {SKILLS.map((s) => (
            <ScoreBar
              key={s}
              label={SKILL_LABELS[s]}
              score={currentSections[s]}
              goal={Math.round(profile.goalScore / 4)}
            />
          ))}
        </div>
        <div className="mt-5">
          <Link to="/today" className="btn-secondary inline-flex w-auto">
            今日のタスクへ <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <p className="text-micro text-ink-subtle">
        AI モード: {settings.aiMode}。スコアは説明可能な近似アルゴリズムによる推定です。
      </p>
    </div>
  );
}
