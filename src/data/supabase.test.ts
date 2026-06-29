import { describe, it, expect, vi, afterEach } from 'vitest';
import { supabaseConfigured, getDeviceId, createCloudSync } from './supabase';
import { Repository } from './repository';
import { createMemoryStore } from './kv';

afterEach(() => vi.unstubAllEnvs());

describe('supabase sync (unconfigured)', () => {
  it('reports not configured and returns a null sync handle without env', () => {
    // Deterministic regardless of any local .env the developer has set.
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
    expect(supabaseConfigured()).toBe(false);
    expect(createCloudSync()).toBeNull();
  });

  it('issues a stable device id', () => {
    const a = getDeviceId();
    const b = getDeviceId();
    expect(a).toBe(b);
    expect(a).toMatch(/^dev-/);
  });
});

describe('Repository import/export round-trip (sync snapshot)', () => {
  it('restores an exported snapshot', async () => {
    const src = new Repository(createMemoryStore());
    await src.saveSettings({ goalScore: 112, reminderTime: '06:30' });
    await src.addWord({
      id: 'v1',
      term: 'lucid',
      meaning: '明晰な',
      box: 1,
      due: '2026-06-23',
      addedAt: '2026-06-23T00:00:00.000Z',
      reps: 0,
      lapses: 0,
    });
    const snapshot = await src.exportAll();

    const dst = new Repository(createMemoryStore());
    await dst.importAll(snapshot);
    expect((await dst.getSettings()).goalScore).toBe(112);
    expect((await dst.getVocab())[0].term).toBe('lucid');
  });
});
