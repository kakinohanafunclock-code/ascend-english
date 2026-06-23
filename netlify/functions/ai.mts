/**
 * Netlify Functions v2 variant of the AI proxy. Mirrors api/ai.ts.
 * Configure CLAUDE_API_KEY in Netlify env. Routed from /api/ai via netlify.toml.
 */
const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';

export default async (req: Request): Promise<Response> => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'method not allowed' }, { status: 405 });
  }
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'CLAUDE_API_KEY is not configured' }, { status: 500 });
  }

  const body = await req.json().catch(() => ({}));
  const { model = DEFAULT_MODEL, system = '', prompt = '', max_tokens = 1024 } = body;

  const upstream = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({ model, max_tokens, system, messages: [{ role: 'user', content: prompt }] }),
  });

  if (!upstream.ok) {
    return Response.json({ error: 'upstream error', detail: await upstream.text() }, { status: upstream.status });
  }
  const data = (await upstream.json()) as { content?: { text?: string }[] };
  const text = (data.content ?? []).map((b) => b.text ?? '').join('');
  return Response.json({ text });
};

export const config = { path: '/api/ai' };
