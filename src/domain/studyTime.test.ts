import { describe, it, expect } from 'vitest';
import {
  aggregateSessions,
  totalMinutes,
  currentStreak,
  minutesInRange,
} from './studyTime';
import type { Attempt } from './types';

function attempt(at: string, durationMin: number, skill: Attempt['skill'] = 'reading'): Attempt {
  return { id: at + skill, skill, taskId: 't', durationMin, at };
}

describe('aggregateSessions', () => {
  it('groups attempts by calendar day and sums minutes', () => {
    const sessions = aggregateSessions([
      attempt('2026-06-20T09:00:00Z', 10, 'reading'),
      attempt('2026-06-20T20:00:00Z', 15, 'writing'),
      attempt('2026-06-21T08:00:00Z', 30, 'listening'),
    ]);
    expect(sessions).toHaveLength(2);
    const d20 = sessions.find((s) => s.date === '2026-06-20')!;
    expect(d20.minutes).toBe(25);
    expect(d20.skills.sort()).toEqual(['reading', 'writing']);
  });

  it('returns sessions sorted ascending by date', () => {
    const sessions = aggregateSessions([
      attempt('2026-06-22T09:00:00Z', 10),
      attempt('2026-06-20T09:00:00Z', 10),
    ]);
    expect(sessions.map((s) => s.date)).toEqual(['2026-06-20', '2026-06-22']);
  });
});

describe('totalMinutes', () => {
  it('sums minutes across sessions', () => {
    const sessions = aggregateSessions([
      attempt('2026-06-20T09:00:00Z', 10),
      attempt('2026-06-21T09:00:00Z', 20),
    ]);
    expect(totalMinutes(sessions)).toBe(30);
  });
});

describe('currentStreak', () => {
  it('counts consecutive active days ending today', () => {
    const sessions = aggregateSessions([
      attempt('2026-06-21T09:00:00Z', 30),
      attempt('2026-06-22T09:00:00Z', 30),
      attempt('2026-06-23T09:00:00Z', 30),
    ]);
    expect(currentStreak(sessions, '2026-06-23')).toBe(3);
  });

  it('allows a grace day (counts a streak ending yesterday)', () => {
    const sessions = aggregateSessions([
      attempt('2026-06-21T09:00:00Z', 30),
      attempt('2026-06-22T09:00:00Z', 30),
    ]);
    expect(currentStreak(sessions, '2026-06-23')).toBe(2);
  });

  it('is broken (0) when the last activity is older than yesterday', () => {
    const sessions = aggregateSessions([attempt('2026-06-20T09:00:00Z', 30)]);
    expect(currentStreak(sessions, '2026-06-23')).toBe(0);
  });

  it('ignores gaps before the current run', () => {
    const sessions = aggregateSessions([
      attempt('2026-06-18T09:00:00Z', 30),
      attempt('2026-06-22T09:00:00Z', 30),
      attempt('2026-06-23T09:00:00Z', 30),
    ]);
    expect(currentStreak(sessions, '2026-06-23')).toBe(2);
  });
});

describe('minutesInRange', () => {
  it('sums minutes within an inclusive date window', () => {
    const sessions = aggregateSessions([
      attempt('2026-06-19T09:00:00Z', 10),
      attempt('2026-06-20T09:00:00Z', 20),
      attempt('2026-06-21T09:00:00Z', 40),
    ]);
    expect(minutesInRange(sessions, '2026-06-20', '2026-06-21')).toBe(60);
  });
});
