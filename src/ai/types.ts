import type { Skill } from '../domain/types';

/** Structured AI feedback contracts (see docs/SPEC.md §5). */

export interface RubricBreakdown {
  taskResponse: number; // 0–5
  coherence: number; // 0–5
  languageUse: number; // 0–5
}

export interface WritingFeedback {
  estimatedScore: number; // 0–5 rubric average
  toeflScaled: number; // 0–30
  strengths: string[];
  improvements: string[];
  correctedText?: string;
  rubric: RubricBreakdown;
  source: 'ai' | 'fallback';
}

export interface SpeakingFeedback {
  estimatedScore: number; // 0–5
  toeflScaled: number; // 0–30
  strengths: string[];
  improvements: string[];
  rubric: { delivery: number; languageUse: number; topicDevelopment: number };
  source: 'ai' | 'fallback';
}

export interface ReadingExplanation {
  summary: string;
  keyPoints: string[];
  vocabulary: { term: string; meaning: string }[];
  source: 'ai' | 'fallback';
}

export type AiTask =
  | { kind: 'writing'; skill: Skill; prompt: string; essay: string; essayType: 'independent' | 'integrated' }
  | { kind: 'speaking'; skill: Skill; prompt: string; transcript: string }
  | { kind: 'reading'; skill: Skill; passage: string; question?: string };

export type AiErrorCode = 'cost_limit' | 'no_credentials' | 'network' | 'parse' | 'aborted';

export class AiError extends Error {
  constructor(
    public code: AiErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'AiError';
  }
}
