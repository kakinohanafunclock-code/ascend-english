/**
 * Serverless AI proxy (Vercel-style Node function; also usable on Netlify via redirect).
 *
 * Keeps the Claude API key server-side. The browser posts { model, system, prompt,
 * max_tokens }; we forward to the Anthropic Messages API and return { text }.
 * Set CLAUDE_API_KEY in the host's environment variables (never commit it).
 */
interface ProxyBody {
  model?: string;
  system?: string;
  prompt?: string;
  max_tokens?: number;
}

const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';

export default async function handler(req: { method?: string; body?: unknown }, res: ResponseLike) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method not allowed' });
  }
  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'CLAUDE_API_KEY is not configured' });
  }

  const body: ProxyBody = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body ?? {});
  const { model = DEFAULT_MODEL, system = '', prompt = '', max_tokens = 1024 } = body;

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens,
        system,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!upstream.ok) {
      const detail = await upstream.text();
      return res.status(upstream.status).json({ error: 'upstream error', detail });
    }

    const data = (await upstream.json()) as { content?: { text?: string }[] };
    const text = (data.content ?? []).map((b) => b.text ?? '').join('');
    return res.status(200).json({ text });
  } catch (err) {
    return res.status(502).json({ error: 'proxy failure', detail: String(err) });
  }
}

interface ResponseLike {
  status(code: number): { json(body: unknown): unknown };
}
