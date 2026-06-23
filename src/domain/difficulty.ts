import type { Difficulty } from './types';

const MIN: Difficulty = 1;
const MAX: Difficulty = 5;

function clampBand(n: number): Difficulty {
  return Math.min(MAX, Math.max(MIN, Math.round(n))) as Difficulty;
}

/**
 * Adaptive step. Accuracy above 0.8 raises the band, below 0.5 lowers it, and the
 * 0.5–0.8 comfort zone holds steady (hysteresis prevents thrashing between items).
 */
export function nextDifficulty(current: Difficulty, recentAccuracy: number): Difficulty {
  if (recentAccuracy > 0.8) return clampBand(current + 1);
  if (recentAccuracy < 0.5) return clampBand(current - 1);
  return current;
}

/** Pick a sensible starting band from an estimated section score (0–30). */
export function recommendStartDifficulty(sectionScore: number): Difficulty {
  const s = Math.min(30, Math.max(0, sectionScore));
  // 0–5 →1, 6–11 →2, 12–17 →3, 18–23 →4, 24–30 →5
  return Math.min(5, Math.floor(s / 6) + 1) as Difficulty;
}
