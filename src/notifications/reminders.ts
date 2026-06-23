/**
 * Daily reminder scheduling.
 *
 * Cost-0 strategy: while a tab/Service Worker is alive we schedule an in-app timeout
 * that asks the SW (or the page) to show a notification at the chosen local time, then
 * reschedules for the next day. When VAPID keys are configured, Web Push can deliver
 * even when the app is closed (see api/ + sw.js). The pure time math is unit-tested.
 */

const PARSE = /^(\d{1,2}):(\d{2})$/;

/** Compute the next Date at which "HH:mm" local time occurs at/after `from`. */
export function computeNextReminder(time: string, from: Date = new Date()): Date {
  const m = PARSE.exec(time);
  if (!m) throw new Error(`invalid time: ${time}`);
  const hours = Number(m[1]);
  const minutes = Number(m[2]);
  const next = new Date(from);
  next.setHours(hours, minutes, 0, 0);
  if (next.getTime() <= from.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

/** Milliseconds from `from` until the next occurrence of "HH:mm". */
export function msUntilNextReminder(time: string, from: Date = new Date()): number {
  return computeNextReminder(time, from).getTime() - from.getTime();
}

export function notificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function notificationPermission(): NotificationPermission {
  return notificationSupported() ? Notification.permission : 'denied';
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!notificationSupported()) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  return Notification.requestPermission();
}

const TITLE = 'Ascend — 今日の学習';
const BODY = '30分の学習プランが待っています。続けてスコアを伸ばしましょう。';

/** Show a notification now (via the Service Worker if available, else directly). */
export async function showReminderNow(): Promise<boolean> {
  if (!notificationSupported() || Notification.permission !== 'granted') return false;
  const options: NotificationOptions = { body: BODY, icon: '/favicon.svg', tag: 'ascend-daily' };
  try {
    const reg = await navigator.serviceWorker?.ready;
    if (reg) {
      await reg.showNotification(TITLE, options);
      return true;
    }
  } catch {
    /* fall through to page notification */
  }
  new Notification(TITLE, options);
  return true;
}

let timer: ReturnType<typeof setTimeout> | null = null;

/** Start (or restart) the daily in-app reminder loop. Returns a cancel function. */
export function scheduleDailyReminder(time: string): () => void {
  cancelDailyReminder();
  const tick = () => {
    void showReminderNow();
    // Reschedule for tomorrow.
    timer = setTimeout(tick, msUntilNextReminder(time));
  };
  timer = setTimeout(tick, msUntilNextReminder(time));
  return cancelDailyReminder;
}

export function cancelDailyReminder(): void {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}
