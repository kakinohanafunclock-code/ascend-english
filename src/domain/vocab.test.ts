import { describe, it, expect } from 'vitest';
import {
  createWord,
  reviewWord,
  isDue,
  dueWords,
  vocabStats,
  hasTerm,
  BOX_INTERVAL_DAYS,
} from './vocab';

const NOW = new Date('2026-06-23T00:00:00.000Z');

describe('createWord', () => {
  it('starts in box 1, due today, with a unique id', () => {
    const a = createWord({ term: 'mitigate', meaning: '軽減する' }, NOW);
    const b = createWord({ term: 'mitigate', meaning: '軽減する' }, NOW);
    expect(a.box).toBe(1);
    expect(a.due).toBe('2026-06-23');
    expect(a.reps).toBe(0);
    expect(a.id).not.toBe(b.id);
  });
});

describe('reviewWord', () => {
  it('"good" promotes a box and schedules further out', () => {
    const w = createWord({ term: 'arbitrary', meaning: '恣意的な' }, NOW);
    const r = reviewWord(w, 'good', NOW);
    expect(r.box).toBe(2);
    expect(r.reps).toBe(1);
    expect(r.due).toBe('2026-06-25'); // +2 days for box 2
  });

  it('caps promotion at the max box', () => {
    let w = createWord({ term: 'viable', meaning: '実行可能な' }, NOW);
    for (let i = 0; i < 10; i++) w = reviewWord(w, 'good', NOW);
    expect(w.box).toBe(5);
    expect(w.due).toBe(`2026-07-09`); // today + 16 days for box 5
  });

  it('"again" resets to box 1, counts a lapse, stays due today', () => {
    let w = createWord({ term: 'nuance', meaning: '微妙な差異' }, NOW);
    w = reviewWord(w, 'good', NOW); // box 2
    const r = reviewWord(w, 'again', NOW);
    expect(r.box).toBe(1);
    expect(r.lapses).toBe(1);
    expect(r.due).toBe('2026-06-23');
    expect(isDue(r, NOW)).toBe(true);
  });

  it('matches the documented box intervals', () => {
    const base = createWord({ term: 'x', meaning: 'y' }, NOW);
    const box2 = reviewWord(base, 'good', NOW);
    expect(box2.due).toBe('2026-06-25');
    expect(BOX_INTERVAL_DAYS[2]).toBe(2);
  });
});

describe('dueWords / stats', () => {
  it('returns only due cards, weakest first', () => {
    const due1 = createWord({ term: 'a', meaning: '1' }, NOW); // due today
    const future = reviewWord(createWord({ term: 'b', meaning: '2' }, NOW), 'good', NOW); // due +2d
    const list = dueWords([future, due1], NOW);
    expect(list.map((w) => w.term)).toEqual(['a']);
  });

  it('computes totals, due and mastered counts', () => {
    const a = createWord({ term: 'a', meaning: '1' }, NOW);
    let b = createWord({ term: 'b', meaning: '2' }, NOW);
    for (let i = 0; i < 5; i++) b = reviewWord(b, 'good', NOW); // mastered, not due
    const stats = vocabStats([a, b], NOW);
    expect(stats.total).toBe(2);
    expect(stats.mastered).toBe(1);
    expect(stats.due).toBe(1); // only `a` is due today
  });
});

describe('hasTerm', () => {
  it('detects duplicates case-insensitively', () => {
    const a = createWord({ term: 'Mitigate', meaning: '軽減する' }, NOW);
    expect(hasTerm([a], 'mitigate')).toBe(true);
    expect(hasTerm([a], 'reduce')).toBe(false);
  });
});
