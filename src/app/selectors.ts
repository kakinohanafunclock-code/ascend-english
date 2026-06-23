import {
  aggregateSessions,
  computeGoalGap,
  currentStreak,
  totalMinutes,
  SKILLS,
  type Attempt,
  type GoalGap,
  type Skill,
  type SkillScores,
  type StudySession,
} from '../domain';
import type { Profile } from '../data/repository';

export function todayISO(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export interface DashboardModel {
  sessions: StudySession[];
  totalMinutes: number;
  streak: number;
  currentSections: SkillScores;
  estimatedTotal: number;
  gap: GoalGap;
  totalTrend: number[];
}

/**
 * Compose study sessions, current per-skill scores (latest scored attempt over the
 * diagnostic baseline), the goal-gap, and a total-score trend for charting.
 */
export function buildDashboard(
  profile: Profile,
  attempts: Attempt[],
  now: Date = new Date(),
): DashboardModel {
  const sessions = aggregateSessions(attempts);
  const minutes = totalMinutes(sessions);
  const streak = currentStreak(sessions, todayISO(now));

  // Walk attempts in time order, updating the running section score when an
  // attempt carries a fresh section estimate; capture the total at each step.
  const running: SkillScores = { ...profile.estimatedSections };
  const sorted = [...attempts].sort((a, b) => a.at.localeCompare(b.at));
  const totalTrend: number[] = [sum(running)];
  for (const a of sorted) {
    if (typeof a.score === 'number') {
      running[a.skill] = a.score;
      totalTrend.push(sum(running));
    }
  }

  const currentSections: SkillScores = running;
  const estimatedTotal = sum(currentSections);
  const gap = computeGoalGap({
    startScores: currentSections,
    goalTotal: profile.goalScore,
    actualMinutes: minutes,
    minutesPerDay: 30,
    fromISO: todayISO(now),
  });

  return {
    sessions,
    totalMinutes: minutes,
    streak,
    currentSections,
    estimatedTotal,
    gap,
    totalTrend,
  };
}

function sum(scores: SkillScores): number {
  return (SKILLS as readonly Skill[]).reduce((s, k) => s + scores[k], 0);
}
