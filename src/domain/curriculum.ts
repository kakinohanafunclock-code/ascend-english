import type {
  Curriculum,
  DailyPlan,
  Difficulty,
  Skill,
  SkillScores,
  StudyTask,
  WeeklyPlan,
} from './types';
import { SKILLS } from './types';
import { recommendStartDifficulty } from './difficulty';

/** Minutes a single unit task takes per skill — sized to pack cleanly into 30 min. */
const UNIT_MINUTES: Record<Skill, number> = {
  reading: 15,
  listening: 15,
  speaking: 10,
  writing: 20,
};

const TASK_TITLE: Record<Skill, string> = {
  reading: 'Reading — アカデミックパッセージ精読 + 設問',
  listening: 'Listening — 講義リスニング + 設問',
  speaking: 'Speaking — Independent お題 録音 + AI添削',
  writing: 'Writing — エッセイ下書き + AI添削',
};

export interface CurriculumParams {
  startScores: SkillScores;
  goalScore: number; // total TOEFL goal (e.g. 105)
  weeks: number;
  minutesPerDay?: number;
  daysPerWeek?: number;
  startDateISO?: string;
}

/**
 * Build a weekly/daily plan from the diagnosis and goal. Per-skill effort is
 * proportional to each skill's deficit (with a small floor for maintenance), packed
 * greedily into the daily minute budget. Weaker skills accrue more total tasks.
 */
export function generateCurriculum(params: CurriculumParams): Curriculum {
  const {
    startScores,
    goalScore,
    weeks,
    minutesPerDay = 30,
    daysPerWeek = 7,
    startDateISO,
  } = params;

  const goalPerSection = goalScore / SKILLS.length;
  // Weight = deficit toward the per-section goal, with a 0.5 maintenance floor.
  const weight: Record<Skill, number> = {} as Record<Skill, number>;
  for (const s of SKILLS) weight[s] = Math.max(0, goalPerSection - startScores[s]) + 0.5;
  const totalWeight = SKILLS.reduce((sum, s) => sum + weight[s], 0);
  const targetShare: Record<Skill, number> = {} as Record<Skill, number>;
  for (const s of SKILLS) targetShare[s] = weight[s] / totalWeight;

  // Skills sorted by weakness (highest weight first) drive weekly focus.
  const byWeakness = [...SKILLS].sort((a, b) => weight[b] - weight[a]);

  // Global served-minutes tracker keeps allocation proportional across the plan.
  const served: Record<Skill, number> = Object.fromEntries(
    SKILLS.map((s) => [s, 0]),
  ) as Record<Skill, number>;
  let totalServed = 0;
  let dayCounter = 0;

  const weeksOut: WeeklyPlan[] = [];
  for (let w = 0; w < weeks; w++) {
    const focusSkills: Skill[] = [
      byWeakness[w % byWeakness.length],
      byWeakness[(w + 1) % byWeakness.length],
    ];
    const days: DailyPlan[] = [];

    for (let d = 0; d < daysPerWeek; d++) {
      const tasks: StudyTask[] = [];
      let remaining = minutesPerDay;
      let n = 0;

      while (true) {
        const candidates = SKILLS.filter((s) => UNIT_MINUTES[s] <= remaining);
        if (candidates.length === 0) break;

        // Pick the most under-served skill relative to its target share; break ties
        // toward the weaker skill so the very first task targets the weakest area.
        const pick = candidates.reduce((best, s) => {
          const deficitS = served[s] - targetShare[s] * totalServed;
          const deficitBest = served[best] - targetShare[best] * totalServed;
          if (deficitS < deficitBest - 1e-9) return s;
          if (Math.abs(deficitS - deficitBest) <= 1e-9 && weight[s] > weight[best]) return s;
          return best;
        });

        const minutes = UNIT_MINUTES[pick];
        const difficulty = progressDifficulty(startScores[pick], w);
        tasks.push({
          id: `w${w}-d${d}-${pick}-${n}`,
          skill: pick,
          kind: pick,
          title: TASK_TITLE[pick],
          difficulty,
          estimatedMinutes: minutes,
        });
        served[pick] += minutes;
        totalServed += minutes;
        remaining -= minutes;
        n++;
      }

      days.push({
        day: dayCounter,
        dateISO: startDateISO ? addDays(startDateISO, dayCounter) : undefined,
        tasks,
        totalMinutes: tasks.reduce((s, t) => s + t.estimatedMinutes, 0),
      });
      dayCounter++;
    }

    weeksOut.push({ weekIndex: w, focusSkills, days });
  }

  return {
    goalScore,
    startScores,
    weeks: weeksOut,
    generatedAt: new Date().toISOString(),
  };
}

/** Start at the band implied by the score, nudging up slightly as weeks progress. */
function progressDifficulty(sectionScore: number, weekIndex: number): Difficulty {
  const base = recommendStartDifficulty(sectionScore);
  return Math.min(5, base + Math.floor(weekIndex / 2)) as Difficulty;
}

function addDays(iso: string, delta: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + delta)).toISOString().slice(0, 10);
}
