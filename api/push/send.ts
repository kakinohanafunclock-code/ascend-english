/**
 * Send the daily reminder to subscriptions whose configured hour matches the current
 * UTC hour. Intended to be invoked by a scheduler (Vercel Cron — see vercel.json — or
 * a GitHub Actions schedule hitting this URL).
 *
 * Requires: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 *
 * Note: scheduling is by the stored "HH:mm" hour compared in UTC — an approximation of
 * each user's local time. Precise per-timezone delivery is a future enhancement; the
 * reliable primary path remains the in-app/Service-Worker local schedule.
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

  const hour = new Date().getUTCHours();
  const { data, error } = await supabase.from('push_subscriptions').select('endpoint, subscription, time');
  if (error) return res.status(500).json({ error: error.message });

  const payload = JSON.stringify({
    title: 'Ascend — 今日の学習',
    body: '30分の学習プランが待っています。続けてスコアを伸ばしましょう。',
  });

  let sent = 0;
  for (const row of data ?? []) {
    const subHour = Number(String(row.time ?? '20:00').split(':')[0]);
    if (subHour !== hour) continue;
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
