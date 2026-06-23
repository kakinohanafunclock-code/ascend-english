/**
 * Store a Web Push subscription for daily reminders.
 * Requires Supabase env (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY) to persist.
 * Without it, returns 200 but does not persist (in-app local schedule still works).
 *
 * Table: push_subscriptions(endpoint text primary key, subscription jsonb, time text)
 */
import { createClient } from '@supabase/supabase-js';

interface Body {
  subscription?: { endpoint?: string };
  time?: string;
}

export default async function handler(req: { method?: string; body?: unknown }, res: ResponseLike) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const body: Body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {});
  if (!body.subscription?.endpoint) return res.status(400).json({ error: 'missing subscription' });

  if (!url || !key) {
    return res.status(200).json({ persisted: false, reason: 'supabase not configured' });
  }

  const supabase = createClient(url, key);
  const { error } = await supabase.from('push_subscriptions').upsert({
    endpoint: body.subscription.endpoint,
    subscription: body.subscription,
    time: body.time ?? '20:00',
  });
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ persisted: true });
}

interface ResponseLike {
  status(code: number): { json(body: unknown): unknown };
}
