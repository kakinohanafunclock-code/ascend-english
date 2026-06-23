import type {
  DiagnosticAnswer,
  ScoreEstimate,
  Skill,
  SkillEstimates,
} from './types';
import { SKILLS } from './types';

/**
 * Diagnostic scoring.
 *
 * Model (explainable, deterministic — see docs/DECISIONS.md):
 *   abilityRatio   = Σ(difficulty · success) / Σ(difficulty)        ∈ [0,1]
 *   difficultyScale = (avgDifficulty + 5) / 10                       ∈ [0.6,1.0]
 *   score(0–30)    = round(30 · abilityRatio · difficultyScale)
 *
 * `success` is 1 for a correct item, or the AI/self rated `quality` (0–1) when
 * provided for productive skills. Harder correct answers count more, and a run of
 * only-easy items cannot reach the section maximum.
 */
export function estimateSkillScores(answers: DiagnosticAnswer[]): SkillEstimates {
  const out = {} as SkillEstimates;
  for (const skill of SKILLS) {
    out[skill] = scoreOne(answers.filter((a) => a.skill === skill));
  }
  return out;
}

function successValue(a: DiagnosticAnswer): number {
  // Productive skills carry a graded quality (0–1); receptive skills are binary.
  if (typeof a.quality === 'number') return a.correct ? clamp(a.quality, 0, 1) : 0;
  return a.correct ? 1 : 0;
}

function scoreOne(items: DiagnosticAnswer[]): ScoreEstimate {
  if (items.length === 0) return { score: 0, low: 0, high: 0 };

  const weightTotal = items.reduce((s, a) => s + a.difficulty, 0);
  const weightEarned = items.reduce((s, a) => s + a.difficulty * successValue(a), 0);
  const abilityRatio = weightTotal === 0 ? 0 : weightEarned / weightTotal;

  const avgDifficulty = items.reduce((s, a) => s + a.difficulty, 0) / items.length;
  const difficultyScale = (avgDifficulty + 5) / 10; // 0.6 .. 1.0

  const score = clamp(Math.round(30 * abilityRatio * difficultyScale), 0, 30);

  // Uncertainty shrinks with more items.
  const margin = Math.max(1, Math.round(6 / Math.sqrt(items.length)));
  return {
    score,
    low: clamp(score - margin, 0, 30),
    high: clamp(score + margin, 0, 30),
  };
}

export interface ToeflEstimate {
  total: number; // 0–120
  low: number;
  high: number;
  sections: SkillEstimates;
}

export function estimateToefl(sections: SkillEstimates): ToeflEstimate {
  const skills = SKILLS as readonly Skill[];
  const sum = (pick: (e: ScoreEstimate) => number) =>
    skills.reduce((s, k) => s + pick(sections[k]), 0);
  return {
    total: clamp(sum((e) => e.score), 0, 120),
    low: clamp(sum((e) => e.low), 0, 120),
    high: clamp(sum((e) => e.high), 0, 120),
    sections,
  };
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
