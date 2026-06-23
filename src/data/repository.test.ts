import { describe, it, expect, beforeEach } from 'vitest';
import { Repository, DEFAULT_SETTINGS, type Profile } from './repository';
import { createMemoryStore, createLocalStore, createIdbStore } from './kv';
import type { Attempt } from '../domain/types';

const profile: Profile = {
  goalScore: 105,
  createdAt: '2026-06-23T00:00:00.000Z',
  diagnostic: { reading: 20, listening: 18, speaking: 16, writing: 22 },
  estimatedToefl: 76,
  estimatedSections: { reading: 20, listening: 18, speaking: 16, writing: 22 },
};

function attempt(at: string, durationMin: number, skill: Attempt['skill'] = 'reading'): Attempt {
  return { id: at + skill, skill, taskId: 't', durationMin, at };
}

describe('Repository (memory store)', () => {
  let repo: Repository;
  beforeEach(() => {
    repo = new Repository(createMemoryStore());
  });

  it('round-trips a profile', async () => {
    expect(await repo.getProfile()).toBeUndefined();
    await repo.saveProfile(profile);
    expect(await repo.getProfile()).toEqual(profile);
  });

  it('returns default settings before anything is saved', async () => {
    expect(await repo.getSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('merges settings patches over existing values', async () => {
    await repo.saveSettings({ reminderEnabled: true, reminderTime: '07:30' });
    const after = await repo.saveSettings({ goalScore: 110 });
    expect(after.reminderEnabled).toBe(true);
    expect(after.reminderTime).toBe('07:30');
    expect(after.goalScore).toBe(110);
    expect((await repo.getSettings()).goalScore).toBe(110);
  });

  it('appends attempts and derives daily sessions', async () => {
    await repo.addAttempt(attempt('2026-06-20T09:00:00Z', 10, 'reading'));
    await repo.addAttempt(attempt('2026-06-20T18:00:00Z', 15, 'writing'));
    await repo.addAttempt(attempt('2026-06-21T09:00:00Z', 30, 'listening'));
    expect(await repo.getAttempts()).toHaveLength(3);
    const sessions = await repo.getSessions();
    expect(sessions).toHaveLength(2);
    expect(sessions[0]).toMatchObject({ date: '2026-06-20', minutes: 25 });
  });

  it('stores and reads AI cache entries by key', async () => {
    expect(await repo.getAiCache('k1')).toBeUndefined();
    await repo.setAiCache('k1', { response: 'hello', at: 'now' });
    expect(await repo.getAiCache('k1')).toEqual({ response: 'hello', at: 'now' });
  });

  it('clears everything', async () => {
    await repo.saveProfile(profile);
    await repo.addAttempt(attempt('2026-06-20T09:00:00Z', 10));
    await repo.clearAll();
    expect(await repo.getProfile()).toBeUndefined();
    expect(await repo.getAttempts()).toEqual([]);
  });
});

describe('Repository (localStorage store)', () => {
  it('persists through the localStorage backend', async () => {
    const repo = new Repository(createLocalStore('test:'));
    await repo.saveProfile(profile);
    const reopened = new Repository(createLocalStore('test:'));
    expect(await reopened.getProfile()).toEqual(profile);
  });
});

describe('Repository (IndexedDB store)', () => {
  it('persists through the IndexedDB backend', async () => {
    const repo = new Repository(createIdbStore('ascend-test', 'kv'));
    await repo.clearAll();
    await repo.saveProfile(profile);
    await repo.addAttempt(attempt('2026-06-22T09:00:00Z', 20));
    expect(await repo.getProfile()).toEqual(profile);
    expect(await repo.getAttempts()).toHaveLength(1);
  });
});
