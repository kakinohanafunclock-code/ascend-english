/** Core domain types shared across logic, data and UI. No side effects here. */

export type Skill = 'reading' | 'listening' | 'speaking' | 'writing';

export const SKILLS: readonly Skill[] = ['reading', 'listening', 'speaking', 'writing'] as const;

export const SKILL_LABELS: Record<Skill, string> = {
  reading: 'Reading',
  listening: 'Listening',
  speaking: 'Speaking',
  writing: 'Writing',
};

/** Per-skill scaled score, each on the TOEFL section scale 0–30. */
export type SkillScores = Record<Skill, number>;

/** Difficulty band for adaptive content selection (1 easiest – 5 hardest). */
export type Difficulty = 1 | 2 | 3 | 4 | 5;

/** A single answered diagnostic item. */
export interface DiagnosticAnswer {
  skill: Skill;
  /** Item difficulty 1–5. */
  difficulty: Difficulty;
  correct: boolean;
  /** Optional self/AI-rated quality 0–1 for productive skills (speaking/writing). */
  quality?: number;
}

/** Estimated section score with an uncertainty range. */
export interface ScoreEstimate {
  score: number; // point estimate 0–30
  low: number; // range lower bound
  high: number; // range upper bound
}

export type SkillEstimates = Record<Skill, ScoreEstimate>;

/** One concrete study unit that fits inside a 30-minute slot. */
export interface StudyTask {
  id: string;
  skill: Skill;
  title: string;
  difficulty: Difficulty;
  estimatedMinutes: number;
  kind: 'reading' | 'listening' | 'speaking' | 'writing';
}

export interface DailyPlan {
  /** ISO weekday index within the plan, 0-based day number from start. */
  day: number;
  dateISO?: string;
  tasks: StudyTask[];
  totalMinutes: number;
}

export interface WeeklyPlan {
  weekIndex: number;
  focusSkills: Skill[];
  days: DailyPlan[];
}

export interface Curriculum {
  goalScore: number;
  startScores: SkillScores;
  weeks: WeeklyPlan[];
  generatedAt: string;
}

/** Record of a completed attempt, persisted for analytics. */
export interface Attempt {
  id: string;
  skill: Skill;
  taskId: string;
  correct?: boolean;
  accuracy?: number; // 0–1 for multi-item tasks
  durationMin: number;
  score?: number; // resulting/estimated section score if applicable
  at: string; // ISO timestamp
}

/** Aggregated learning for a single calendar day. */
export interface StudySession {
  date: string; // YYYY-MM-DD
  minutes: number;
  skills: Skill[];
}
