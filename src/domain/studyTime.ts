import type { Attempt, Skill, StudySession } from './types';

/** Extract the calendar day (UTC) from an ISO timestamp without timezone drift. */
function dayOf(iso: string): string {
  // ISO timestamps always start with YYYY-MM-DD; slicing is timezone-stable.
  return iso.slice(0, 10);
}

/** Group attempts into one session per calendar day, sorted ascending by date. */
export function aggregateSessions(attempts: Attempt[]): StudySession[] {
  const byDay = new Map<string, { minutes: number; skills: Set<Skill> }>();
  for (const a of attempts) {
    const day = dayOf(a.at);
    const entry = byDay.get(day) ?? { minutes: 0, skills: new Set<Skill>() };
    entry.minutes += a.durationMin;
    entry.skills.add(a.skill);
    byDay.set(day, entry);
  }
  return [...byDay.entries()]
    .map(([date, v]) => ({ date, minutes: v.minutes, skills: [...v.skills] }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function totalMinutes(sessions: StudySession[]): number {
  return sessions.reduce((s, x) => s + x.minutes, 0);
}

/** Days between two YYYY-MM-DD strings (b - a), via UTC to avoid DST issues. */
function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  const ms = Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad);
  return Math.round(ms / 86_400_000);
}

/**
 * Consecutive active days ending at the most recent activity, provided that run
 * reaches today or yesterday (a one-day grace so an unfinished "today" doesn't
 * reset the streak). Returns 0 if the latest activity is older than yesterday.
 */
export function currentStreak(sessions: StudySession[], todayISO: string): number {
  if (sessions.length === 0) return 0;
  const active = new Set(sessions.map((s) => s.date));
  const sorted = [...active].sort();
  const last = sorted[sorted.length - 1];

  const gap = daysBetween(last, todayISO);
  if (gap < 0 || gap > 1) return 0; // future date, or streak already broken

  let streak = 0;
  let cursor = last;
  while (active.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

function addDays(iso: string, delta: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + delta));
  return dt.toISOString().slice(0, 10);
}

/** Sum minutes for sessions whose date falls inside [startISO, endISO] inclusive. */
export function minutesInRange(
  sessions: StudySession[],
  startISO: string,
  endISO: string,
): number {
  return sessions
    .filter((s) => s.date >= startISO && s.date <= endISO)
    .reduce((sum, s) => sum + s.minutes, 0);
}
