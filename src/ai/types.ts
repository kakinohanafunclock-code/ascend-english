import type { Skill } from '../domain/types';

/** Structured AI feedback contracts (see docs/SPEC.md §5). */

export interface RubricBreakdown {
  taskResponse: number; // 0–5
  coherence: number; // 0–5
  languageUse: number; // 0–5
}

/** A notable word the learner can save to their word-book. */
export interface GlossaryItem {
  term: string;
  meaning: string; // Japanese
  example?: string;
}

export interface WritingFeedback {
  estimatedScore: number; // 0–5 rubric average
  toeflScaled: number; // 0–30
  strengths: string[];
  improvements: string[];
  correctedText?: string;
  /** Japanese translation of the corrected/model text. */
  translationJa?: string;
  /** Difficult words worth saving (term + JP meaning). */
  glossary: GlossaryItem[];
  rubric: RubricBreakdown;
  source: 'ai' | 'fallback';
}

export interface SpeakingFeedback {
  estimatedScore: number; // 0–5
  toeflScaled: number; // 0–30
  strengths: string[];
  improvements: string[];
  translationJa?: string;
  glossary: GlossaryItem[];
  rubric: { delivery: number; languageUse: number; topicDevelopment: number };
  source: 'ai' | 'fallback';
}

export interface ReadingExplanation {
  summary: string;
  /** Japanese translation of the summary (and/or passage). */
  translationJa?: string;
  keyPoints: string[];
  vocabulary: GlossaryItem[];
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
