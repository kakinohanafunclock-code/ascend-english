/** Small, fast, dependency-free string hash (FNV-1a) for cache keys. */
export function hashString(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  // Unsigned hex.
  return (h >>> 0).toString(16).padStart(8, '0');
}

/** Stable cache key from the model and the full prompt payload. */
export function cacheKey(model: string, payload: unknown): string {
  return `${model}:${hashString(JSON.stringify(payload))}`;
}
