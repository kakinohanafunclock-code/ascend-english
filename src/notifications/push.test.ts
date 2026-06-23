import { describe, it, expect } from 'vitest';
import { urlBase64ToUint8Array } from './push';

describe('urlBase64ToUint8Array', () => {
  it('decodes a base64url VAPID key to bytes', () => {
    // "hello" base64url-encoded is "aGVsbG8".
    const bytes = urlBase64ToUint8Array('aGVsbG8');
    expect(Array.from(bytes)).toEqual([...'hello'].map((c) => c.charCodeAt(0)));
  });

  it('handles padding and url-safe chars (- _) without throwing', () => {
    expect(() => urlBase64ToUint8Array('a-_b')).not.toThrow();
    const bytes = urlBase64ToUint8Array('a-_b');
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(0);
  });
});
