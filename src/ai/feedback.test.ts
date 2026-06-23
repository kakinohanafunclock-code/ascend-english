import { describe, it, expect } from 'vitest';
import { createAiClient } from './client';
import {
  correctWriting,
  correctSpeaking,
  explainReading,
  fallbackWriting,
} from './feedback';

function mockClient(responder: (prompt: string) => string) {
  return createAiClient({ mode: 'mock', model: 'm' }, { mockResponder: (req) => responder(req.prompt) });
}

describe('correctWriting', () => {
  it('parses a valid AI JSON response', async () => {
    const client = mockClient(() =>
      JSON.stringify({
        estimatedScore: 4,
        rubric: { taskResponse: 4, coherence: 4, languageUse: 4 },
        strengths: ['clear thesis'],
        improvements: ['add an example'],
        correctedText: 'Improved essay.',
      }),
    );
    const fb = await correctWriting(client, {
      prompt: 'Do you agree?',
      essay: 'I agree because ...',
      essayType: 'independent',
    });
    expect(fb.source).toBe('ai');
    expect(fb.estimatedScore).toBe(4);
    expect(fb.toeflScaled).toBe(24); // 4/5*30
    expect(fb.strengths).toContain('clear thesis');
    expect(fb.correctedText).toBe('Improved essay.');
  });

  it('parses the Japanese translation and glossary', async () => {
    const client = mockClient(() =>
      JSON.stringify({
        estimatedScore: 3,
        rubric: { taskResponse: 3, coherence: 3, languageUse: 3 },
        strengths: ['良い構成'],
        improvements: ['具体例を追加'],
        correctedText: 'A better essay.',
        translationJa: 'より良いエッセイ。',
        glossary: [{ term: 'cohesion', meaning: '結束性', example: 'Good cohesion helps flow.' }],
      }),
    );
    const fb = await correctWriting(client, { prompt: 'Q', essay: 'text', essayType: 'independent' });
    expect(fb.translationJa).toBe('より良いエッセイ。');
    expect(fb.glossary).toHaveLength(1);
    expect(fb.glossary[0]).toMatchObject({ term: 'cohesion', meaning: '結束性' });
  });

  it('falls back to the local estimator when the AI returns junk', async () => {
    const client = mockClient(() => 'not json at all');
    const fb = await correctWriting(client, {
      prompt: 'Q',
      essay: 'Short essay with a few words here.',
      essayType: 'independent',
    });
    expect(fb.source).toBe('fallback');
    expect(fb.toeflScaled).toBeGreaterThanOrEqual(0);
    expect(fb.toeflScaled).toBeLessThanOrEqual(30);
    expect(fb.improvements.length).toBeGreaterThan(0);
  });

  it('falls back when the AI client has no credentials/budget', async () => {
    const client = createAiClient({ mode: 'proxy', model: 'm' }, {}); // no proxyUrl
    const fb = await correctWriting(client, { prompt: 'Q', essay: 'text', essayType: 'integrated' });
    expect(fb.source).toBe('fallback');
  });
});

describe('fallbackWriting', () => {
  it('rewards a longer, on-target essay over a tiny one', () => {
    const long = fallbackWriting({
      prompt: 'Q',
      essay: Array.from({ length: 320 }, (_, i) => `word${i}`).join(' '),
      essayType: 'independent',
    });
    const short = fallbackWriting({ prompt: 'Q', essay: 'too short', essayType: 'independent' });
    expect(long.rubric.taskResponse).toBeGreaterThan(short.rubric.taskResponse);
    expect(long.toeflScaled).toBeGreaterThan(short.toeflScaled);
  });
});

describe('correctSpeaking', () => {
  it('parses a valid AI JSON response', async () => {
    const client = mockClient(() =>
      JSON.stringify({
        estimatedScore: 3,
        rubric: { delivery: 3, languageUse: 3, topicDevelopment: 3 },
        strengths: ['good pace'],
        improvements: ['more detail'],
      }),
    );
    const fb = await correctSpeaking(client, { prompt: 'Describe a place', transcript: 'I like ...' });
    expect(fb.source).toBe('ai');
    expect(fb.toeflScaled).toBe(18);
  });

  it('falls back on junk', async () => {
    const client = mockClient(() => '???');
    const fb = await correctSpeaking(client, { prompt: 'P', transcript: 'a b c d e' });
    expect(fb.source).toBe('fallback');
  });
});

describe('explainReading', () => {
  it('parses a valid AI JSON response', async () => {
    const client = mockClient(() =>
      JSON.stringify({
        summary: 'It is about photosynthesis.',
        keyPoints: ['light reaction', 'calvin cycle'],
        vocabulary: [{ term: 'chlorophyll', meaning: 'green pigment' }],
      }),
    );
    const ex = await explainReading(client, { passage: 'Plants convert light...' });
    expect(ex.source).toBe('ai');
    expect(ex.keyPoints).toHaveLength(2);
    expect(ex.vocabulary[0].term).toBe('chlorophyll');
  });

  it('falls back to a naive summary on junk', async () => {
    const client = mockClient(() => 'no json');
    const ex = await explainReading(client, {
      passage: 'First sentence here. Second sentence. Third sentence.',
    });
    expect(ex.source).toBe('fallback');
    expect(ex.summary).toBe('First sentence here.');
  });
});
