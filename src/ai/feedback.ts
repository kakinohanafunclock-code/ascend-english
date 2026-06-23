import type { AiClient } from './client';
import { AiError } from './types';
import type {
  GlossaryItem,
  ReadingExplanation,
  SpeakingFeedback,
  WritingFeedback,
} from './types';

const SYSTEM_TUTOR =
  'You are an expert TOEFL iBT tutor helping a Japanese student reach 105+. ' +
  'Be precise, encouraging and specific. Write all strengths, improvements and ' +
  'explanations in natural Japanese (日本語). Always respond with ONLY a single valid ' +
  'JSON object, no prose.';

function rubricToScaled(avg: number): number {
  return Math.round((Math.min(5, Math.max(0, avg)) / 5) * 30);
}

function parseJsonLoose<T>(text: string): T {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) {
    throw new AiError('parse', 'no JSON object found in AI response');
  }
  try {
    return JSON.parse(text.slice(start, end + 1)) as T;
  } catch {
    throw new AiError('parse', 'invalid JSON in AI response');
  }
}

function words(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

// ---------------- Writing ----------------

export interface WritingTask {
  prompt: string;
  essay: string;
  essayType: 'independent' | 'integrated';
}

export async function correctWriting(
  client: AiClient,
  task: WritingTask,
): Promise<WritingFeedback> {
  const userPrompt =
    `Task type: ${task.essayType}\nQuestion: ${task.prompt}\n\nStudent essay:\n"""${task.essay}"""\n\n` +
    'Score with the TOEFL Writing rubric. Return JSON with keys: ' +
    'estimatedScore (0-5), rubric {taskResponse,coherence,languageUse} (each 0-5), ' +
    'strengths (Japanese string[]), improvements (Japanese string[] — 具体的で丁寧に), ' +
    'correctedText (an improved English version), ' +
    'translationJa (the Japanese translation of correctedText), ' +
    'glossary ([{term, meaning(Japanese), example}] of difficult or useful words from the essay/correction).';
  try {
    const { text } = await client.complete({ system: SYSTEM_TUTOR, prompt: userPrompt });
    const raw = parseJsonLoose<Partial<WritingFeedback>>(text);
    const rubric = {
      taskResponse: clamp5(raw.rubric?.taskResponse),
      coherence: clamp5(raw.rubric?.coherence),
      languageUse: clamp5(raw.rubric?.languageUse),
    };
    const estimatedScore =
      typeof raw.estimatedScore === 'number'
        ? clamp5(raw.estimatedScore)
        : (rubric.taskResponse + rubric.coherence + rubric.languageUse) / 3;
    return {
      estimatedScore,
      toeflScaled: rubricToScaled(estimatedScore),
      strengths: asStrings(raw.strengths),
      improvements: asStrings(raw.improvements),
      correctedText: typeof raw.correctedText === 'string' ? raw.correctedText : undefined,
      translationJa: typeof raw.translationJa === 'string' ? raw.translationJa : undefined,
      glossary: asGlossary(raw.glossary),
      rubric,
      source: 'ai',
    };
  } catch {
    return fallbackWriting(task);
  }
}

/** Deterministic local rubric estimate so the app works without AI/network. */
export function fallbackWriting(task: WritingTask): WritingFeedback {
  const w = words(task.essay);
  const wordCount = w.length;
  const sentences = task.essay.split(/[.!?]+/).filter((s) => s.trim().length > 0).length || 1;
  const avgSentenceLen = wordCount / sentences;
  const uniqueRatio = wordCount === 0 ? 0 : new Set(w.map((x) => x.toLowerCase())).size / wordCount;

  const target = task.essayType === 'independent' ? 300 : 200;
  const lengthScore = clamp5((wordCount / target) * 4 + 1);
  const varietyScore = clamp5(uniqueRatio * 6);
  const flowScore = clamp5(avgSentenceLen >= 12 && avgSentenceLen <= 24 ? 4 : 3);

  const rubric = {
    taskResponse: lengthScore,
    coherence: flowScore,
    languageUse: varietyScore,
  };
  const estimatedScore = (rubric.taskResponse + rubric.coherence + rubric.languageUse) / 3;

  const strengths: string[] = [];
  const improvements: string[] = [];
  if (wordCount >= target) strengths.push('十分な分量で論点を展開できています。');
  else improvements.push(`語数が${wordCount}語です。目安${target}語に向けて具体例を増やしましょう。`);
  if (uniqueRatio > 0.5) strengths.push('語彙の重複が少なく、表現に幅があります。');
  else improvements.push('同じ語の繰り返しが目立ちます。同義語や言い換えを使いましょう。');
  improvements.push('各段落の主張→根拠→具体例の構造を明確にしましょう。');

  return {
    estimatedScore,
    toeflScaled: rubricToScaled(estimatedScore),
    strengths,
    improvements,
    glossary: [],
    rubric,
    source: 'fallback',
  };
}

// ---------------- Speaking ----------------

export interface SpeakingTask {
  prompt: string;
  transcript: string;
}

export async function correctSpeaking(
  client: AiClient,
  task: SpeakingTask,
): Promise<SpeakingFeedback> {
  const userPrompt =
    `Speaking prompt: ${task.prompt}\n\nStudent spoken response (transcript):\n"""${task.transcript}"""\n\n` +
    'Score with the TOEFL Speaking rubric. Return JSON with keys: estimatedScore (0-5), ' +
    'rubric {delivery,languageUse,topicDevelopment} (each 0-5), strengths (Japanese string[]), ' +
    'improvements (Japanese string[] — 具体的に), ' +
    'translationJa (a Japanese translation/summary of a stronger model answer), ' +
    'glossary ([{term, meaning(Japanese), example}] of useful words/phrases).';
  try {
    const { text } = await client.complete({ system: SYSTEM_TUTOR, prompt: userPrompt });
    const raw = parseJsonLoose<Partial<SpeakingFeedback>>(text);
    const rubric = {
      delivery: clamp5(raw.rubric?.delivery),
      languageUse: clamp5(raw.rubric?.languageUse),
      topicDevelopment: clamp5(raw.rubric?.topicDevelopment),
    };
    const estimatedScore =
      typeof raw.estimatedScore === 'number'
        ? clamp5(raw.estimatedScore)
        : (rubric.delivery + rubric.languageUse + rubric.topicDevelopment) / 3;
    return {
      estimatedScore,
      toeflScaled: rubricToScaled(estimatedScore),
      strengths: asStrings(raw.strengths),
      improvements: asStrings(raw.improvements),
      translationJa: typeof raw.translationJa === 'string' ? raw.translationJa : undefined,
      glossary: asGlossary(raw.glossary),
      rubric,
      source: 'ai',
    };
  } catch {
    return fallbackSpeaking(task);
  }
}

export function fallbackSpeaking(task: SpeakingTask): SpeakingFeedback {
  const w = words(task.transcript);
  const wordCount = w.length;
  // A strong 45-60s response is ~110-140 words.
  const developmentScore = clamp5((wordCount / 120) * 4 + 1);
  const uniqueRatio = wordCount === 0 ? 0 : new Set(w.map((x) => x.toLowerCase())).size / wordCount;
  const languageScore = clamp5(uniqueRatio * 6);
  const rubric = {
    delivery: clamp5(3),
    languageUse: languageScore,
    topicDevelopment: developmentScore,
  };
  const estimatedScore = (rubric.delivery + rubric.languageUse + rubric.topicDevelopment) / 3;
  const strengths: string[] = [];
  const improvements: string[] = [];
  if (wordCount >= 100) strengths.push('発話量が十分で、主張を展開できています。');
  else improvements.push(`発話が${wordCount}語と短めです。理由と具体例を2つ加えましょう。`);
  improvements.push('First… Second… Finally… の型で構成を明確にしましょう。');
  return {
    estimatedScore,
    toeflScaled: rubricToScaled(estimatedScore),
    strengths,
    improvements,
    glossary: [],
    rubric,
    source: 'fallback',
  };
}

// ---------------- Reading ----------------

export interface ReadingTask {
  passage: string;
  question?: string;
}

export async function explainReading(
  client: AiClient,
  task: ReadingTask,
): Promise<ReadingExplanation> {
  const userPrompt =
    `Passage:\n"""${task.passage}"""\n` +
    (task.question ? `\nFocus question: ${task.question}\n` : '') +
    '\nProvide a precise reading explanation for a Japanese learner. Return JSON with keys: ' +
    'summary (Japanese string), translationJa (Japanese translation of the passage), ' +
    'keyPoints (Japanese string[]), vocabulary ([{term, meaning(Japanese), example}]).';
  try {
    const { text } = await client.complete({ system: SYSTEM_TUTOR, prompt: userPrompt });
    const raw = parseJsonLoose<Partial<ReadingExplanation>>(text);
    return {
      summary: typeof raw.summary === 'string' ? raw.summary : fallbackReading(task).summary,
      translationJa: typeof raw.translationJa === 'string' ? raw.translationJa : undefined,
      keyPoints: asStrings(raw.keyPoints),
      vocabulary: asGlossary(raw.vocabulary),
      source: 'ai',
    };
  } catch {
    return fallbackReading(task);
  }
}

export function fallbackReading(task: ReadingTask): ReadingExplanation {
  const sentences = task.passage
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    summary: sentences[0] ?? '本文の要約を生成できませんでした。',
    keyPoints: sentences.slice(0, 3),
    vocabulary: [],
    source: 'fallback',
  };
}

function asGlossary(v: unknown): GlossaryItem[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is { term: unknown; meaning?: unknown; example?: unknown } =>
      Boolean(x) && typeof x === 'object' && 'term' in x && typeof (x as { term: unknown }).term === 'string',
    )
    .map((x) => ({
      term: String(x.term),
      meaning: String(x.meaning ?? ''),
      example: typeof x.example === 'string' ? x.example : undefined,
    }));
}

// ---------------- helpers ----------------

function clamp5(n: unknown): number {
  const v = typeof n === 'number' && Number.isFinite(n) ? n : 0;
  return Math.min(5, Math.max(0, v));
}

function asStrings(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
}
