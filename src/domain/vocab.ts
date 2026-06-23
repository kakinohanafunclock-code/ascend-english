/**
 * Vocabulary spaced-repetition (Leitner system).
 * Pure, deterministic, timezone-stable (UTC date strings). No side effects.
 */

export interface VocabWord {
  id: string;
  term: string;
  meaning: string; // Japanese
  example?: string;
  pos?: string;
  box: number; // 1 (new) .. 5 (mastered)
  due: string; // YYYY-MM-DD, next review date
  addedAt: string; // ISO timestamp
  reps: number;
  lapses: number;
  lastReviewedAt?: string;
}

export interface VocabSeedInput {
  term: string;
  meaning: string;
  example?: string;
  pos?: string;
}

export type ReviewGrade = 'again' | 'good';

/** Days to wait before next review for each Leitner box. */
export const BOX_INTERVAL_DAYS: Record<number, number> = { 1: 1, 2: 2, 3: 4, 4: 8, 5: 16 };
export const MAX_BOX = 5;

export function todayISO(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

function addDays(iso: string, delta: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + delta)).toISOString().slice(0, 10);
}

let seq = 0;
function genId(term: string): string {
  seq += 1;
  return `v-${term.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${seq}`;
}

/** Create a fresh card in box 1, due today. */
export function createWord(seed: VocabSeedInput, now: Date = new Date()): VocabWord {
  return {
    id: genId(seed.term),
    term: seed.term.trim(),
    meaning: seed.meaning.trim(),
    example: seed.example,
    pos: seed.pos,
    box: 1,
    due: todayISO(now),
    addedAt: now.toISOString(),
    reps: 0,
    lapses: 0,
  };
}

/**
 * Apply a review grade. "good" promotes one box (capped) and schedules further out;
 * "again" demotes to box 1 (counts a lapse) and keeps it due immediately.
 */
export function reviewWord(word: VocabWord, grade: ReviewGrade, now: Date = new Date()): VocabWord {
  const today = todayISO(now);
  if (grade === 'good') {
    const box = Math.min(MAX_BOX, word.box + 1);
    return {
      ...word,
      box,
      due: addDays(today, BOX_INTERVAL_DAYS[box]),
      reps: word.reps + 1,
      lastReviewedAt: now.toISOString(),
    };
  }
  return {
    ...word,
    box: 1,
    due: today,
    reps: word.reps + 1,
    lapses: word.lapses + 1,
    lastReviewedAt: now.toISOString(),
  };
}

export function isDue(word: VocabWord, now: Date = new Date()): boolean {
  return word.due <= todayISO(now);
}

/** Cards due for review, soonest/weakest first. */
export function dueWords(words: VocabWord[], now: Date = new Date()): VocabWord[] {
  return words
    .filter((w) => isDue(w, now))
    .sort((a, b) => a.due.localeCompare(b.due) || a.box - b.box);
}

export interface VocabStats {
  total: number;
  due: number;
  mastered: number;
  learning: number;
}

export function vocabStats(words: VocabWord[], now: Date = new Date()): VocabStats {
  return {
    total: words.length,
    due: words.filter((w) => isDue(w, now)).length,
    mastered: words.filter((w) => w.box >= MAX_BOX).length,
    learning: words.filter((w) => w.box < MAX_BOX).length,
  };
}

/** True if `term` already exists (case-insensitive) — used to avoid duplicates. */
export function hasTerm(words: VocabWord[], term: string): boolean {
  const t = term.trim().toLowerCase();
  return words.some((w) => w.term.toLowerCase() === t);
}
