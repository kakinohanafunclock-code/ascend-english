import type { ReactNode } from 'react';

/** Horizontal score meter on the 0–30 TOEFL section scale. */
export function ScoreBar({
  label,
  score,
  max = 30,
  goal,
}: {
  label: string;
  score: number;
  max?: number;
  goal?: number;
}) {
  const pct = Math.max(0, Math.min(100, (score / max) * 100));
  const goalPct = goal != null ? Math.max(0, Math.min(100, (goal / max) * 100)) : null;
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-small text-ink-muted">{label}</span>
        <span className="text-small font-medium tabular-nums">{Math.round(score)}</span>
      </div>
      <div className="relative h-2 rounded-full bg-canvas border border-line">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-accent"
          style={{ width: `${pct}%` }}
        />
        {goalPct != null && (
          <div
            className="absolute inset-y-[-3px] w-px bg-ink-subtle"
            style={{ left: `${goalPct}%` }}
            aria-hidden
          />
        )}
      </div>
    </div>
  );
}

/** Circular progress ring (percent 0–100). Pure SVG. */
export function ProgressRing({
  percent,
  size = 96,
  stroke = 8,
  label,
}: {
  percent: number;
  size?: number;
  stroke?: number;
  label?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = c - (clamped / 100) * c;
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-line)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute text-center leading-tight">{label}</div>
    </div>
  );
}

export interface Series {
  name: string;
  points: number[];
  color?: string;
}

/** Multi-series line chart on a fixed value domain. Editorial, gridless-but-baseline. */
export function LineChart({
  series,
  max = 30,
  height = 160,
  width = 520,
}: {
  series: Series[];
  max?: number;
  height?: number;
  width?: number;
}) {
  const pad = { top: 12, right: 12, bottom: 18, left: 24 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const longest = Math.max(1, ...series.map((s) => s.points.length));

  const x = (i: number) => pad.left + (longest <= 1 ? 0 : (i / (longest - 1)) * innerW);
  const y = (v: number) => pad.top + innerH - (Math.max(0, Math.min(max, v)) / max) * innerH;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-auto"
      role="img"
      aria-label="score trend chart"
    >
      {/* baseline + midline */}
      {[0, 0.5, 1].map((t) => (
        <line
          key={t}
          x1={pad.left}
          x2={width - pad.right}
          y1={pad.top + innerH * (1 - t)}
          y2={pad.top + innerH * (1 - t)}
          stroke="var(--color-line)"
          strokeWidth={1}
        />
      ))}
      {series.map((s) => {
        const color = s.color ?? 'var(--color-accent)';
        if (s.points.length === 0) return null;
        const d = s.points.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(v)}`).join(' ');
        return (
          <g key={s.name}>
            <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
            {s.points.map((v, i) => (
              <circle key={i} cx={x(i)} cy={y(v)} r={2.5} fill={color} />
            ))}
          </g>
        );
      })}
    </svg>
  );
}

export function StatCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="card card-pad">
      <div className="flex items-center justify-between mb-2">
        <span className="eyebrow">{label}</span>
        {icon && <span className="text-ink-subtle">{icon}</span>}
      </div>
      <div className="text-display font-semibold tabular-nums leading-none">{value}</div>
      {sub && <div className="text-small text-ink-muted mt-1.5">{sub}</div>}
    </div>
  );
}
