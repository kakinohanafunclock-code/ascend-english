/**
 * Registers the service worker used for daily reminders.
 * Safe no-op where service workers are unavailable (SSR, tests, http on some browsers).
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  // Vite serves /sw.js from /public in dev and build.
  if (import.meta.env.DEV && import.meta.env.MODE === 'test') return null;
  try {
    return await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  } catch {
    return null;
  }
}
