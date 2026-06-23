import { AiError } from './types';
import { cacheKey } from './hash';

export interface AiCache {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T): Promise<void>;
}

export interface AiClientConfig {
  mode: 'proxy' | 'direct' | 'mock';
  model: string;
  proxyUrl?: string;
  apiKey?: string;
  /** Hard cap on live API calls per session to bound cost. */
  maxCallsPerSession?: number;
  retries?: number;
  retryDelayMs?: number;
}

export interface AiDeps {
  fetcher?: typeof fetch;
  cache?: AiCache;
  sleep?: (ms: number) => Promise<void>;
  /** Used only in mode 'mock' — returns the assistant text for a request. */
  mockResponder?: (req: CompleteRequest) => string;
}

export interface CompleteRequest {
  system: string;
  prompt: string;
  maxTokens?: number;
  /** Set false to bypass the cache (rare; default true). */
  cacheable?: boolean;
}

export interface CompleteResult {
  text: string;
  cached: boolean;
  callsUsed: number;
}

export interface AiClient {
  complete(req: CompleteRequest): Promise<CompleteResult>;
  getStats(): { callsUsed: number; maxCalls: number; remaining: number };
  hasCredentials(): boolean;
}

const DEFAULTS = {
  maxCallsPerSession: 50,
  retries: 2,
  retryDelayMs: 400,
};

export function createAiClient(config: AiClientConfig, deps: AiDeps = {}): AiClient {
  const fetcher = deps.fetcher ?? globalThis.fetch?.bind(globalThis);
  const sleep = deps.sleep ?? ((ms: number) => new Promise((r) => setTimeout(r, ms)));
  const maxCalls = config.maxCallsPerSession ?? DEFAULTS.maxCallsPerSession;
  const retries = config.retries ?? DEFAULTS.retries;
  const retryDelayMs = config.retryDelayMs ?? DEFAULTS.retryDelayMs;
  let callsUsed = 0;

  function hasCredentials(): boolean {
    if (config.mode === 'mock') return true;
    if (config.mode === 'proxy') return Boolean(config.proxyUrl);
    return Boolean(config.apiKey);
  }

  async function callBackend(req: CompleteRequest): Promise<string> {
    if (config.mode === 'mock') {
      if (!deps.mockResponder) throw new AiError('no_credentials', 'mock responder not provided');
      return deps.mockResponder(req);
    }
    if (!fetcher) throw new AiError('network', 'no fetch implementation available');

    const { url, init } = buildRequest(config, req);
    let lastErr: unknown;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await fetcher(url, init);
        if (!res.ok) {
          // 4xx (except 429) are not retryable.
          if (res.status >= 400 && res.status < 500 && res.status !== 429) {
            throw new AiError('network', `AI request failed: ${res.status}`);
          }
          throw new Error(`retryable status ${res.status}`);
        }
        return extractText(await res.json());
      } catch (err) {
        lastErr = err;
        // AiErrors are terminal (e.g. non-retryable 4xx, parse). Only generic
        // errors (transient network / 5xx / 429) are retried.
        if (err instanceof AiError) throw err;
        if (attempt < retries) await sleep(retryDelayMs * (attempt + 1));
      }
    }
    throw new AiError('network', `AI request failed after retries: ${String(lastErr)}`);
  }

  return {
    hasCredentials,
    getStats: () => ({ callsUsed, maxCalls, remaining: Math.max(0, maxCalls - callsUsed) }),

    async complete(req: CompleteRequest): Promise<CompleteResult> {
      const cacheable = req.cacheable !== false;
      const key = cacheKey(config.model, { system: req.system, prompt: req.prompt });

      if (cacheable && deps.cache) {
        const hit = await deps.cache.get<{ text: string }>(key);
        if (hit) return { text: hit.text, cached: true, callsUsed };
      }

      if (!hasCredentials()) {
        throw new AiError('no_credentials', 'AI credentials are not configured');
      }
      if (callsUsed >= maxCalls) {
        throw new AiError('cost_limit', `session call limit (${maxCalls}) reached`);
      }

      const text = await callBackend(req);
      callsUsed++;

      if (cacheable && deps.cache) {
        await deps.cache.set(key, { text, at: new Date().toISOString() });
      }
      return { text, cached: false, callsUsed };
    },
  };
}

function buildRequest(
  config: AiClientConfig,
  req: CompleteRequest,
): { url: string; init: RequestInit } {
  const maxTokens = req.maxTokens ?? 1024;
  if (config.mode === 'proxy') {
    return {
      url: config.proxyUrl!,
      init: {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          model: config.model,
          system: req.system,
          prompt: req.prompt,
          max_tokens: maxTokens,
        }),
      },
    };
  }
  // direct (browser → Anthropic). For local verification only; keys must not ship.
  return {
    url: 'https://api.anthropic.com/v1/messages',
    init: {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': config.apiKey!,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: maxTokens,
        system: req.system,
        messages: [{ role: 'user', content: req.prompt }],
      }),
    },
  };
}

/** Accept both our proxy shape ({text}) and the Anthropic Messages shape. */
function extractText(data: unknown): string {
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (typeof obj.text === 'string') return obj.text;
    if (Array.isArray(obj.content)) {
      const text = obj.content
        .map((b) => (b && typeof b === 'object' && 'text' in b ? String((b as { text: unknown }).text) : ''))
        .join('');
      if (text) return text;
    }
  }
  throw new AiError('parse', 'could not extract text from AI response');
}
