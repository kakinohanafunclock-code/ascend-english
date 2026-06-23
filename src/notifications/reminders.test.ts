import { describe, it, expect } from 'vitest';
import { computeNextReminder, msUntilNextReminder } from './reminders';

describe('computeNextReminder', () => {
  it('returns today at the given time when it is still in the future', () => {
    const from = new Date(2026, 5, 23, 10, 0, 0); // 10:00 local
    const next = computeNextReminder('20:00', from);
    expect(next.getFullYear()).toBe(2026);
    expect(next.getDate()).toBe(23);
    expect(next.getHours()).toBe(20);
    expect(next.getMinutes()).toBe(0);
  });

  it('rolls over to tomorrow when the time has already passed', () => {
    const from = new Date(2026, 5, 23, 21, 0, 0); // 21:00 local
    const next = computeNextReminder('20:00', from);
    expect(next.getDate()).toBe(24);
    expect(next.getHours()).toBe(20);
  });

  it('rolls over when exactly at the reminder time (strictly future)', () => {
    const from = new Date(2026, 5, 23, 20, 0, 0);
    const next = computeNextReminder('20:00', from);
    expect(next.getDate()).toBe(24);
  });

  it('throws on a malformed time string', () => {
    expect(() => computeNextReminder('not-a-time')).toThrow();
  });
});

describe('msUntilNextReminder', () => {
  it('is positive and matches the computed target', () => {
    const from = new Date(2026, 5, 23, 19, 30, 0);
    const ms = msUntilNextReminder('20:00', from);
    expect(ms).toBe(30 * 60 * 1000); // 30 minutes
  });
});
