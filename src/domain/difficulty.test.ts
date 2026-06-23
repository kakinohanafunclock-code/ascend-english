import { describe, it, expect } from 'vitest';
import { nextDifficulty, recommendStartDifficulty } from './difficulty';

describe('nextDifficulty', () => {
  it('raises difficulty when accuracy is high', () => {
    expect(nextDifficulty(3, 0.9)).toBe(4);
  });

  it('lowers difficulty when accuracy is low', () => {
    expect(nextDifficulty(3, 0.3)).toBe(2);
  });

  it('holds difficulty in the comfortable middle band', () => {
    expect(nextDifficulty(3, 0.65)).toBe(3);
  });

  it('never goes below 1 or above 5', () => {
    expect(nextDifficulty(5, 1)).toBe(5);
    expect(nextDifficulty(1, 0)).toBe(1);
  });

  it('treats the boundaries with hysteresis (0.8 holds, just above raises)', () => {
    expect(nextDifficulty(2, 0.8)).toBe(2);
    expect(nextDifficulty(2, 0.81)).toBe(3);
    expect(nextDifficulty(2, 0.5)).toBe(2);
    expect(nextDifficulty(2, 0.49)).toBe(1);
  });
});

describe('recommendStartDifficulty', () => {
  it('maps low section scores to easy bands and high scores to hard bands', () => {
    expect(recommendStartDifficulty(0)).toBe(1);
    expect(recommendStartDifficulty(30)).toBe(5);
    const mid = recommendStartDifficulty(15);
    expect(mid).toBeGreaterThanOrEqual(2);
    expect(mid).toBeLessThanOrEqual(4);
  });

  it('is monotonic non-decreasing in score', () => {
    let prev = 0;
    for (let s = 0; s <= 30; s++) {
      const d = recommendStartDifficulty(s) as number;
      expect(d).toBeGreaterThanOrEqual(prev);
      prev = d;
    }
  });
});
