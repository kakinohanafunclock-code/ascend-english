import { describe, it, expect } from 'vitest';
import {
  estimateSkillScores,
  estimateToefl,
  type DiagnosticAnswer,
} from './index';
import type { Difficulty, Skill } from './types';

function ans(skill: Skill, difficulty: Difficulty, correct: boolean): DiagnosticAnswer {
  return { skill, difficulty, correct };
}

describe('estimateSkillScores', () => {
  it('returns 0 for a skill with no answers', () => {
    const est = estimateSkillScores([]);
    expect(est.reading.score).toBe(0);
    expect(est.reading.low).toBe(0);
    expect(est.reading.high).toBe(0);
  });

  it('caps an all-easy perfect run below the maximum (difficulty matters)', () => {
    const answers = [1, 1, 1, 1].map((d) => ans('reading', d as Difficulty, true));
    // ratio 1.0, avgDiff 1 -> scale 0.6 -> 18
    expect(estimateSkillScores(answers).reading.score).toBe(18);
  });

  it('awards the full section score for an all-hard perfect run', () => {
    const answers = [5, 5, 5, 5].map((d) => ans('listening', d as Difficulty, true));
    expect(estimateSkillScores(answers).listening.score).toBe(30);
  });

  it('weights harder correct answers more than easy ones', () => {
    const hardCorrect = estimateSkillScores([
      ans('reading', 5, true),
      ans('reading', 5, true),
      ans('reading', 1, false),
      ans('reading', 1, false),
    ]).reading.score;
    const easyCorrect = estimateSkillScores([
      ans('reading', 1, true),
      ans('reading', 1, true),
      ans('reading', 5, false),
      ans('reading', 5, false),
    ]).reading.score;
    expect(hardCorrect).toBeGreaterThan(easyCorrect);
  });

  it('computes a deterministic mid value (2/4 correct at difficulty 3 -> 12)', () => {
    const answers = [
      ans('writing', 3, true),
      ans('writing', 3, true),
      ans('writing', 3, false),
      ans('writing', 3, false),
    ];
    expect(estimateSkillScores(answers).writing.score).toBe(12);
  });

  it('keeps every score within 0..30 and a valid range', () => {
    const est = estimateSkillScores([
      ans('reading', 4, true),
      ans('listening', 2, false),
      ans('speaking', 3, true),
      ans('writing', 5, true),
    ]);
    for (const s of ['reading', 'listening', 'speaking', 'writing'] as Skill[]) {
      expect(est[s].score).toBeGreaterThanOrEqual(0);
      expect(est[s].score).toBeLessThanOrEqual(30);
      expect(est[s].low).toBeLessThanOrEqual(est[s].score);
      expect(est[s].high).toBeGreaterThanOrEqual(est[s].score);
      expect(est[s].low).toBeGreaterThanOrEqual(0);
      expect(est[s].high).toBeLessThanOrEqual(30);
    }
  });

  it('uses quality for productive skills when provided', () => {
    const strong = estimateSkillScores([
      { skill: 'speaking', difficulty: 3, correct: true, quality: 1 },
    ]).speaking.score;
    const weak = estimateSkillScores([
      { skill: 'speaking', difficulty: 3, correct: true, quality: 0.2 },
    ]).speaking.score;
    expect(strong).toBeGreaterThan(weak);
  });
});

describe('estimateToefl', () => {
  it('sums the four sections into a 0..120 total', () => {
    const est = estimateSkillScores([
      ...[5, 5].map((d) => ans('reading', d as Difficulty, true)),
      ...[5, 5].map((d) => ans('listening', d as Difficulty, true)),
      ...[5, 5].map((d) => ans('speaking', d as Difficulty, true)),
      ...[5, 5].map((d) => ans('writing', d as Difficulty, true)),
    ]);
    const total = estimateToefl(est);
    expect(total.total).toBe(120);
    expect(total.total).toBeGreaterThanOrEqual(0);
    expect(total.total).toBeLessThanOrEqual(120);
    expect(total.low).toBeLessThanOrEqual(total.total);
    expect(total.high).toBeGreaterThanOrEqual(total.total);
  });
});
