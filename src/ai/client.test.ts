import { describe, it, expect, vi } from 'vitest';
import { createAiClient, type AiClientConfig } from './client';
import { AiError } from './types';
import { createMemoryStore } from '../data/kv';

function okResponse(text: string) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ content: [{ type: 'text', text }] }),
  } as unknown as Response;
}

const proxyConfig: AiClientConfig = {
  mode: 'proxy',
  model: 'claude-haiku-4-5',
  proxyUrl: '/api/ai',
  retries: 2,
  retryDelayMs: 0,
};

describe('createAiClient — caching', () => {
  it('serves identical requests from cache without a second backend call', async () => {
    const fetcher = vi.fn(async () => okResponse('cached answer'));
    const client = createAiClient(proxyConfig, {
      fetcher: fetcher as unknown as typeof fetch,
      cache: createMemoryStore(),
    });

    const a = await client.complete({ system: 's', prompt: 'p' });
    const b = await client.complete({ system: 's', prompt: 'p' });

    expect(a.text).toBe('cached answer');
    expect(a.cached).toBe(false);
    expect(b.cached).toBe(true);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});

describe('createAiClient — cost guard', () => {
  it('throws once the session call limit is reached', async () => {
    const fetcher = vi.fn(async () => okResponse('x'));
    const client = createAiClient(
      { ...proxyConfig, maxCallsPerSession: 1 },
      { fetcher: fetcher as unknown as typeof fetch },
    );
    await client.complete({ system: 's', prompt: 'one' });
    await expect(client.complete({ system: 's', prompt: 'two' })).rejects.toMatchObject({
      code: 'cost_limit',
    });
    expect(client.getStats().remaining).toBe(0);
  });
});

describe('createAiClient — credentials', () => {
  it('refuses to call when proxy url is missing', async () => {
    const client = createAiClient({ mode: 'proxy', model: 'm' }, {});
    await expect(client.complete({ system: 's', prompt: 'p' })).rejects.toBeInstanceOf(AiError);
    expect(client.hasCredentials()).toBe(false);
  });
});

describe('createAiClient — retries', () => {
  it('retries transient failures then succeeds', async () => {
    let n = 0;
    const fetcher = vi.fn(async () => {
      n++;
      if (n < 3) throw new Error('network blip');
      return okResponse('recovered');
    });
    const client = createAiClient(proxyConfig, { fetcher: fetcher as unknown as typeof fetch });
    const res = await client.complete({ system: 's', prompt: 'p' });
    expect(res.text).toBe('recovered');
    expect(fetcher).toHaveBeenCalledTimes(3);
  });

  it('does not retry non-retryable 4xx responses', async () => {
    const fetcher = vi.fn(async () => ({ ok: false, status: 400, json: async () => ({}) }) as unknown as Response);
    const client = createAiClient(proxyConfig, { fetcher: fetcher as unknown as typeof fetch });
    await expect(client.complete({ system: 's', prompt: 'p' })).rejects.toMatchObject({
      code: 'network',
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});

describe('createAiClient — mock mode and response shapes', () => {
  it('uses the mock responder', async () => {
    const client = createAiClient(
      { mode: 'mock', model: 'm' },
      { mockResponder: (req) => `echo:${req.prompt}` },
    );
    const res = await client.complete({ system: 's', prompt: 'hi' });
    expect(res.text).toBe('echo:hi');
  });

  it('parses the simple proxy {text} shape', async () => {
    const fetcher = vi.fn(
      async () => ({ ok: true, status: 200, json: async () => ({ text: 'plain' }) }) as unknown as Response,
    );
    const client = createAiClient(proxyConfig, { fetcher: fetcher as unknown as typeof fetch });
    const res = await client.complete({ system: 's', prompt: 'p' });
    expect(res.text).toBe('plain');
  });
});
