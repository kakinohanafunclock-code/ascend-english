/**
 * Send the daily reminder to all stored subscriptions. Intended to be invoked by a
 * scheduler (Vercel Cron — see vercel.json — or a GitHub Actions schedule hitting this URL).
 *
 * Requires: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 *
 * Free-tier note: Vercel Hobby allows only one cron run per day, so this fires once daily
 * (vercel.json schedule) for every subscriber rather than honoring each user's chosen hour.
 * Precise per-user/per-timezone delivery would need a paid hourly cron (then re-enable the
 * hour filter) or an external scheduler; the reliable primary path remains the in-app /
 * Service-Worker local schedule, which does respect the user's exact time.
 */
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

export default async function handler(req: { method?: string }, res: ResponseLike) {
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } =
    process.env as Record<string, string | undefined>;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'push not fully configured' });
  }
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'method not allowed' });
  }

  webpush.setVapidDetails('mailto:reminders@ascend.app', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data, error } = await supabase.from('push_subscriptions').select('endpoint, subscription');
  if (error) return res.status(500).json({ error: error.message });

  const payload = JSON.stringify({
    title: 'Ascend — 今日の学習',
    body: '30分の学習プランが待っています。続けてスコアを伸ばしましょう。',
  });

  let sent = 0;
  for (const row of data ?? []) {
    try {
      await webpush.sendNotification(row.subscription, payload);
      sent++;
    } catch (err) {
      // Drop expired subscriptions (410 Gone / 404).
      const status = (err as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', row.endpoint);
      }
    }
  }
  return res.status(200).json({ sent });
}

interface ResponseLike {
  status(code: number): { json(body: unknown): unknown };
}
