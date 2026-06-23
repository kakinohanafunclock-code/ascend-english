import { createAiClient, type AiClient, type AiCache } from './client';

/**
 * Build the app's AI client from environment config. Defaults to the cheap model
 * and proxy mode (keys stay server-side). Falls back to mock when nothing is set,
 * so the app still runs (feedback uses local heuristics).
 */
export function createConfiguredAiClient(cache?: AiCache): AiClient {
  const env = import.meta.env;
  const model = env.VITE_CLAUDE_MODEL || 'claude-haiku-4-5-20251001';
  const mode = (env.VITE_AI_MODE as 'proxy' | 'direct' | undefined) ?? 'proxy';

  if (mode === 'direct' && env.VITE_CLAUDE_API_KEY) {
    return createAiClient({ mode: 'direct', model, apiKey: env.VITE_CLAUDE_API_KEY }, { cache });
  }
  // proxy is the default for production (server function holds the key).
  return createAiClient(
    { mode: 'proxy', model, proxyUrl: env.VITE_AI_PROXY_URL || '/api/ai' },
    { cache },
  );
}
