/**
 * Web Push (VAPID) subscription flow.
 *
 * Closed-app delivery requires a push server with the VAPID private key and stored
 * subscriptions (see api/push/*). When VITE_VAPID_PUBLIC_KEY is unset, push is simply
 * unavailable and the app falls back to the in-app/Service-Worker local schedule.
 */

/** Convert a base64url VAPID public key into the Uint8Array the Push API expects. */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

export function pushConfigured(): boolean {
  return Boolean(import.meta.env.VITE_VAPID_PUBLIC_KEY);
}

export function pushSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator &&
    typeof window !== 'undefined' &&
    'PushManager' in window
  );
}

const SUBSCRIBE_URL = '/api/push/subscribe';

export async function getExistingSubscription(): Promise<PushSubscription | null> {
  if (!pushSupported()) return null;
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

/**
 * Subscribe this device to push and register the subscription with the server.
 * Returns null (caller falls back to local notifications) when push is not
 * configured/supported or permission is denied.
 */
export async function subscribeToPush(time: string): Promise<PushSubscription | null> {
  if (!pushSupported() || !pushConfigured()) return null;
  if (Notification.permission !== 'granted') {
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') return null;
  }
  const reg = await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  const sub =
    existing ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        import.meta.env.VITE_VAPID_PUBLIC_KEY as string,
      ) as BufferSource,
    }));

  try {
    await fetch(SUBSCRIBE_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ subscription: sub, time }),
    });
  } catch {
    // Subscription still valid locally; server registration can be retried later.
  }
  return sub;
}

export async function unsubscribeFromPush(): Promise<void> {
  const sub = await getExistingSubscription();
  if (sub) await sub.unsubscribe();
}
