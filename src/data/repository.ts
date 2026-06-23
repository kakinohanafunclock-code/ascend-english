import type {
  Attempt,
  Curriculum,
  SkillScores,
  StudySession,
} from '../domain/types';
import { aggregateSessions } from '../domain/studyTime';
import { createStore, type KeyValueStore } from './kv';

export interface Profile {
  goalScore: number;
  createdAt: string;
  diagnostic: SkillScores;
  estimatedToefl: number;
  estimatedSections: SkillScores;
}

export type AiMode = 'proxy' | 'direct';

export interface Settings {
  reminderEnabled: boolean;
  reminderTime: string; // HH:mm (24h)
  goalScore: number;
  aiMode: AiMode;
}

export const DEFAULT_SETTINGS: Settings = {
  reminderEnabled: false,
  reminderTime: '20:00',
  goalScore: 105,
  aiMode: 'proxy',
};

const KEYS = {
  profile: 'profile',
  settings: 'settings',
  attempts: 'attempts',
  curriculum: 'curriculum',
  aiCachePrefix: 'aicache:',
} as const;

/** Typed persistence facade over a KeyValueStore. */
export class Repository {
  constructor(private store: KeyValueStore = createStore()) {}

  // --- Profile ---
  async getProfile(): Promise<Profile | undefined> {
    return this.store.get<Profile>(KEYS.profile);
  }
  async saveProfile(profile: Profile): Promise<void> {
    await this.store.set(KEYS.profile, profile);
  }

  // --- Settings (always resolves, merging stored over defaults) ---
  async getSettings(): Promise<Settings> {
    const stored = await this.store.get<Partial<Settings>>(KEYS.settings);
    return { ...DEFAULT_SETTINGS, ...stored };
  }
  async saveSettings(patch: Partial<Settings>): Promise<Settings> {
    const next = { ...(await this.getSettings()), ...patch };
    await this.store.set(KEYS.settings, next);
    return next;
  }

  // --- Attempts ---
  async getAttempts(): Promise<Attempt[]> {
    return (await this.store.get<Attempt[]>(KEYS.attempts)) ?? [];
  }
  async addAttempt(attempt: Attempt): Promise<void> {
    const all = await this.getAttempts();
    all.push(attempt);
    await this.store.set(KEYS.attempts, all);
  }
  /** Derived sessions (source of truth is attempts). */
  async getSessions(): Promise<StudySession[]> {
    return aggregateSessions(await this.getAttempts());
  }

  // --- Curriculum ---
  async getCurriculum(): Promise<Curriculum | undefined> {
    return this.store.get<Curriculum>(KEYS.curriculum);
  }
  async saveCurriculum(curriculum: Curriculum): Promise<void> {
    await this.store.set(KEYS.curriculum, curriculum);
  }

  // --- AI cache ---
  async getAiCache<T>(key: string): Promise<T | undefined> {
    return this.store.get<T>(KEYS.aiCachePrefix + key);
  }
  async setAiCache<T>(key: string, value: T): Promise<void> {
    await this.store.set(KEYS.aiCachePrefix + key, value);
  }

  // --- Lifecycle ---
  async exportAll(): Promise<Record<string, unknown>> {
    const out: Record<string, unknown> = {};
    for (const key of await this.store.keys()) out[key] = await this.store.get(key);
    return out;
  }
  async clearAll(): Promise<void> {
    await this.store.clear();
  }
}
