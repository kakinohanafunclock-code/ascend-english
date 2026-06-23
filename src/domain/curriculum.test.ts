import { describe, it, expect } from 'vitest';
import { generateCurriculum } from './curriculum';
import type { Curriculum, Skill, SkillScores } from './types';
import { SKILLS } from './types';

const scores = (r: number, l: number, s: number, w: number): SkillScores => ({
  reading: r,
  listening: l,
  speaking: s,
  writing: w,
});

function allTasks(c: Curriculum) {
  return c.weeks.flatMap((wk) => wk.days.flatMap((d) => d.tasks));
}

describe('generateCurriculum', () => {
  it('produces the requested number of weeks and days', () => {
    const c = generateCurriculum({
      startScores: scores(20, 20, 20, 20),
      goalScore: 105,
      weeks: 4,
    });
    expect(c.weeks).toHaveLength(4);
    for (const wk of c.weeks) expect(wk.days).toHaveLength(7);
    expect(c.goalScore).toBe(105);
    expect(typeof c.generatedAt).toBe('string');
  });

  it('keeps each day within the 30-minute budget and non-empty', () => {
    const c = generateCurriculum({
      startScores: scores(18, 22, 16, 20),
      goalScore: 105,
      weeks: 3,
    });
    for (const wk of c.weeks) {
      for (const d of wk.days) {
        expect(d.tasks.length).toBeGreaterThan(0);
        expect(d.totalMinutes).toBeLessThanOrEqual(30);
        expect(d.totalMinutes).toBe(d.tasks.reduce((s, t) => s + t.estimatedMinutes, 0));
      }
    }
  });

  it('respects a custom daily budget and days-per-week', () => {
    const c = generateCurriculum({
      startScores: scores(20, 20, 20, 20),
      goalScore: 105,
      weeks: 2,
      minutesPerDay: 45,
      daysPerWeek: 5,
    });
    expect(c.weeks[0].days).toHaveLength(5);
    for (const wk of c.weeks) {
      for (const d of wk.days) expect(d.totalMinutes).toBeLessThanOrEqual(45);
    }
  });

  it('allocates more tasks to weaker skills', () => {
    const c = generateCurriculum({
      startScores: scores(10, 28, 28, 28), // reading is far the weakest
      goalScore: 105,
      weeks: 4,
    });
    const counts = Object.fromEntries(SKILLS.map((s) => [s, 0])) as Record<Skill, number>;
    for (const t of allTasks(c)) counts[t.skill]++;
    for (const s of ['listening', 'speaking', 'writing'] as Skill[]) {
      expect(counts.reading).toBeGreaterThan(counts[s]);
    }
  });

  it('focuses the first week on the weakest skill', () => {
    const c = generateCurriculum({
      startScores: scores(12, 25, 25, 25),
      goalScore: 105,
      weeks: 2,
    });
    expect(c.weeks[0].focusSkills).toContain('reading');
  });

  it('emits unique task ids and valid difficulty/minutes', () => {
    const c = generateCurriculum({
      startScores: scores(15, 18, 20, 22),
      goalScore: 110,
      weeks: 3,
    });
    const tasks = allTasks(c);
    const ids = new Set(tasks.map((t) => t.id));
    expect(ids.size).toBe(tasks.length);
    for (const t of tasks) {
      expect(t.difficulty).toBeGreaterThanOrEqual(1);
      expect(t.difficulty).toBeLessThanOrEqual(5);
      expect(t.estimatedMinutes).toBeGreaterThan(0);
      expect(t.estimatedMinutes).toBeLessThanOrEqual(30);
      expect(t.title.length).toBeGreaterThan(0);
    }
  });

  it('assigns ISO start dates across consecutive days when a start date is given', () => {
    const c = generateCurriculum({
      startScores: scores(20, 20, 20, 20),
      goalScore: 105,
      weeks: 1,
      startDateISO: '2026-06-23',
    });
    expect(c.weeks[0].days[0].dateISO).toBe('2026-06-23');
    expect(c.weeks[0].days[1].dateISO).toBe('2026-06-24');
  });
});
