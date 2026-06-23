import {
  estimateSkillScores,
  type Attempt,
  type DiagnosticAnswer,
  type Skill,
} from '../../domain';
import type { QuizResultItem } from '../components/Quiz';

/** Map graded quiz items into diagnostic-answer shape for scoring. */
export function itemsToAnswers(items: QuizResultItem[]): DiagnosticAnswer[] {
  return items.map((i) => ({
    skill: i.question.skill,
    difficulty: i.question.difficulty,
    correct: i.correct,
  }));
}

/** Estimate a single-skill section score (0–30) from graded quiz items. */
export function sectionScoreFromItems(skill: Skill, items: QuizResultItem[]): number {
  return estimateSkillScores(itemsToAnswers(items))[skill].score;
}

let counter = 0;
export function newId(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter}`;
}

export function makeAttempt(params: {
  skill: Skill;
  taskId: string;
  durationMin: number;
  accuracy?: number;
  correct?: boolean;
  score?: number;
}): Attempt {
  return {
    id: newId('att'),
    skill: params.skill,
    taskId: params.taskId,
    durationMin: params.durationMin,
    accuracy: params.accuracy,
    correct: params.correct,
    score: params.score,
    at: new Date().toISOString(),
  };
}
