import type { SkillScores } from './types';
import { SKILLS } from './types';

/**
 * Heuristic study-hours required per TOEFL point of improvement.
 * Configurable; documented in docs/DECISIONS.md as an explainable estimate
 * (official guidance puts meaningful gains at roughly 8–15h/point near the top).
 */
export const HOURS_PER_POINT = 8;

function total(scores: SkillScores): number {
  return SKILLS.reduce((s, k) => s + scores[k], 0);
}

/** Estimated total study hours to move from `start` up to `goalTotal`. */
export function estimateRequiredHours(
  start: SkillScores,
  goalTotal: number,
  hoursPerPoint: number = HOURS_PER_POINT,
): number {
  const pointGap = Math.max(0, goalTotal - total(start));
  return pointGap * hoursPerPoint;
}

export interface GoalGap {
  currentTotal: number;
  goalTotal: number;
  pointGap: number;
  requiredHours: number;
  actualHours: number;
  remainingHours: number;
  percentComplete: number; // 0–100, in study-time terms
  projectedDate?: string; // YYYY-MM-DD, when a daily budget is supplied
}

export interface GoalGapParams {
  startScores: SkillScores;
  goalTotal: number;
  actualMinutes: number;
  minutesPerDay?: number;
  fromISO?: string;
  hoursPerPoint?: number;
}

export function computeGoalGap(params: GoalGapParams): GoalGap {
  const { startScores, goalTotal, actualMinutes, minutesPerDay, fromISO } = params;
  const currentTotal = total(startScores);
  const pointGap = Math.max(0, goalTotal - currentTotal);
  const requiredHours = estimateRequiredHours(
    startScores,
    goalTotal,
    params.hoursPerPoint ?? HOURS_PER_POINT,
  );
  const actualHours = round1(actualMinutes / 60);
  const remainingHours = Math.max(0, round1(requiredHours - actualHours));
  const percentComplete =
    requiredHours <= 0 ? 100 : Math.min(100, Math.round((actualHours / requiredHours) * 100));

  let projectedDate: string | undefined;
  if (fromISO) {
    if (remainingHours <= 0) {
      projectedDate = fromISO;
    } else if (minutesPerDay && minutesPerDay > 0) {
      const days = Math.ceil(remainingHours / (minutesPerDay / 60));
      projectedDate = addDays(fromISO, days);
    }
  }

  return {
    currentTotal,
    goalTotal,
    pointGap,
    requiredHours,
    actualHours,
    remainingHours,
    percentComplete,
    projectedDate,
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function addDays(iso: string, delta: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + delta)).toISOString().slice(0, 10);
}
