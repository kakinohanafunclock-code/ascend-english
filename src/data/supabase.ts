/**
 * Optional Supabase cloud sync. Enabled only when VITE_SUPABASE_URL and
 * VITE_SUPABASE_ANON_KEY are set; otherwise every entry point is a safe no-op and the
 * app stays fully local. The Supabase SDK is loaded lazily (dynamic import) so it adds
 * nothing to the initial bundle for users who don't enable sync.
 *
 * Sync model: a single JSON snapshot per device (last-write-wins), which keeps the
 * free-tier footprint tiny and avoids per-table conflict resolution.
 *
 * Schema (see supabase/schema.sql):
 *   user_state(device_id text primary key, data jsonb, updated_at timestamptz)
 */
import type { SupabaseClient } from '@supabase/supabase-js';

export function supabaseConfigured(): boolean {
  return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
}

let clientPromise: Promise<SupabaseClient> | null = null;
async function loadClient(): Promise<SupabaseClient> {
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js').then((m) =>
      m.createClient(
        import.meta.env.VITE_SUPABASE_URL as string,
        import.meta.env.VITE_SUPABASE_ANON_KEY as string,
      ),
    );
  }
  return clientPromise;
}

const DEVICE_KEY = 'ascend:deviceId';

/** Stable per-device id (created once, persisted in localStorage). */
export function getDeviceId(): string {
  let id = typeof localStorage !== 'undefined' ? localStorage.getItem(DEVICE_KEY) : null;
  if (!id) {
    id = `dev-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

export interface CloudSnapshot {
  data: Record<string, unknown>;
  updatedAt: string;
}

export interface CloudSync {
  push(snapshot: Record<string, unknown>): Promise<void>;
  pull(): Promise<CloudSnapshot | null>;
}

/** Returns a sync handle, or null when Supabase isn't configured. */
export function createCloudSync(): CloudSync | null {
  if (!supabaseConfigured()) return null;
  const deviceId = getDeviceId();
  return {
    async push(snapshot) {
      const sb = await loadClient();
      await sb
        .from('user_state')
        .upsert({ device_id: deviceId, data: snapshot, updated_at: new Date().toISOString() });
    },
    async pull() {
      const sb = await loadClient();
      const { data } = await sb
        .from('user_state')
        .select('data, updated_at')
        .eq('device_id', deviceId)
        .maybeSingle();
      if (!data) return null;
      return { data: data.data as Record<string, unknown>, updatedAt: data.updated_at as string };
    },
  };
}
