import { describe, it, expect } from 'vitest';
import { estimateRequiredHours, computeGoalGap } from './gap';
import type { SkillScores } from './types';

const scores = (r: number, l: number, s: number, w: number): SkillScores => ({
  reading: r,
  listening: l,
  speaking: s,
  writing: w,
});

describe('estimateRequiredHours', () => {
  it('is zero when already at or above the goal', () => {
    expect(estimateRequiredHours(scores(28, 28, 27, 27), 105)).toBe(0); // total 110
  });

  it('scales with the point gap', () => {
    const start = scores(20, 20, 20, 20); // total 80, gap 25 to 105
    expect(estimateRequiredHours(start, 105)).toBe(25 * 8);
  });

  it('a bigger gap requires more hours', () => {
    const small = estimateRequiredHours(scores(25, 25, 24, 24), 105); // total 98
    const big = estimateRequiredHours(scores(15, 15, 15, 15), 105); // total 60
    expect(big).toBeGreaterThan(small);
  });
});

describe('computeGoalGap', () => {
  it('reports remaining hours and percent complete from actual minutes', () => {
    const gap = computeGoalGap({
      startScores: scores(20, 20, 20, 20), // total 80 -> 200h required
      goalTotal: 105,
      actualMinutes: 60 * 50, // 50h done
    });
    expect(gap.requiredHours).toBe(200);
    expect(gap.actualHours).toBe(50);
    expect(gap.remainingHours).toBe(150);
    expect(gap.percentComplete).toBe(25);
    expect(gap.pointGap).toBe(25);
  });

  it('caps percent complete at 100 and remaining at 0 once required time is met', () => {
    const gap = computeGoalGap({
      startScores: scores(26, 26, 26, 26), // total 104 -> gap 1 -> 8h required
      goalTotal: 105,
      actualMinutes: 60 * 40, // 40h done, far exceeds
    });
    expect(gap.remainingHours).toBe(0);
    expect(gap.percentComplete).toBe(100);
  });

  it('projects a completion date from a daily study budget', () => {
    const gap = computeGoalGap({
      startScores: scores(20, 20, 20, 20),
      goalTotal: 105,
      actualMinutes: 0,
      minutesPerDay: 30,
      fromISO: '2026-06-23',
    });
    // 200h remaining / 0.5h per day = 400 days from 2026-06-23
    expect(gap.projectedDate).toBe('2027-07-28');
  });

  it('handles an already-complete goal cleanly', () => {
    const gap = computeGoalGap({
      startScores: scores(28, 28, 28, 28),
      goalTotal: 105,
      actualMinutes: 0,
    });
    expect(gap.requiredHours).toBe(0);
    expect(gap.remainingHours).toBe(0);
    expect(gap.percentComplete).toBe(100);
  });
});
