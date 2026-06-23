import type { Difficulty, Skill } from '../domain/types';

/** A multiple-choice diagnostic/lesson item. */
export interface MCQuestion {
  id: string;
  skill: Skill;
  difficulty: Difficulty;
  prompt: string;
  options: string[];
  answerIndex: number;
  explanation?: string;
}

/**
 * Diagnostic items — a few per skill. Reading/Listening are comprehension MCQs;
 * Speaking/Writing use objective proxy items (grammar/organization judgement) so the
 * diagnostic stays deterministic and AI-free. Estimated scores feed scoring.ts.
 */
export const DIAGNOSTIC: MCQuestion[] = [
  // Reading
  {
    id: 'd-r1',
    skill: 'reading',
    difficulty: 2,
    prompt:
      'In the sentence "The committee deferred the decision," the word "deferred" most nearly means:',
    options: ['rejected', 'postponed', 'announced', 'reversed'],
    answerIndex: 1,
  },
  {
    id: 'd-r2',
    skill: 'reading',
    difficulty: 4,
    prompt:
      'A passage argues a hypothesis is "not without merit, yet far from conclusive." This implies the author is:',
    options: ['fully convinced', 'entirely dismissive', 'cautiously skeptical', 'indifferent'],
    answerIndex: 2,
  },
  {
    id: 'd-r3',
    skill: 'reading',
    difficulty: 5,
    prompt:
      'Which transition best signals a counterargument: "___, the data suggest the opposite trend."',
    options: ['Consequently', 'Nonetheless', 'Therefore', 'Likewise'],
    answerIndex: 1,
  },
  // Listening
  {
    id: 'd-l1',
    skill: 'listening',
    difficulty: 2,
    prompt:
      'A professor says, "Let\'s table that for now." In academic English this means the topic will be:',
    options: ['discussed immediately', 'set aside for later', 'removed entirely', 'voted on'],
    answerIndex: 1,
  },
  {
    id: 'd-l2',
    skill: 'listening',
    difficulty: 3,
    prompt:
      'A lecturer stresses "the KEY point here" before a sentence. This intonation usually marks:',
    options: ['a digression', 'an example only', 'the main idea', 'a correction'],
    answerIndex: 2,
  },
  {
    id: 'd-l3',
    skill: 'listening',
    difficulty: 4,
    prompt:
      'A student asks for clarification; the professor replies, "Precisely." The professor is:',
    options: ['disagreeing', 'confirming', 'changing topic', 'asking back'],
    answerIndex: 1,
  },
  // Speaking (objective proxy: best-organized spoken response)
  {
    id: 'd-s1',
    skill: 'speaking',
    difficulty: 3,
    prompt: 'Which opening best frames a 45-second independent response?',
    options: [
      'Um, I think maybe it is good, I don\'t know.',
      'I strongly prefer studying abroad for two main reasons.',
      'There are many things to say about this topic.',
      'Yes.',
    ],
    answerIndex: 1,
  },
  {
    id: 'd-s2',
    skill: 'speaking',
    difficulty: 4,
    prompt: 'Which sentence shows the clearest cause–effect signposting?',
    options: [
      'It is good and also bad and interesting.',
      'Because tuition rose, enrollment consequently declined.',
      'Tuition, enrollment, declined, rose.',
      'I like it because reasons.',
    ],
    answerIndex: 1,
  },
  // Writing (objective proxy: grammar/cohesion)
  {
    id: 'd-w1',
    skill: 'writing',
    difficulty: 3,
    prompt: 'Choose the grammatically correct sentence.',
    options: [
      'Despite of the rain, the event continued.',
      'Although it was raining, the event continued.',
      'Even the rain, the event was continued.',
      'The event, raining, continued.',
    ],
    answerIndex: 1,
  },
  {
    id: 'd-w2',
    skill: 'writing',
    difficulty: 5,
    prompt: 'Which revision best improves cohesion between two ideas?',
    options: [
      'Cities grow. Pollution increases.',
      'Cities grow; as a result, pollution often increases.',
      'Cities grow and pollution and increases.',
      'Pollution cities grow increases.',
    ],
    answerIndex: 1,
  },
];

export interface ReadingLesson {
  id: string;
  difficulty: Difficulty;
  title: string;
  passage: string;
  questions: MCQuestion[];
}

export const READING_LESSONS: ReadingLesson[] = [
  {
    id: 'r-photosynthesis',
    difficulty: 3,
    title: 'Photosynthesis and Carbon Fixation',
    passage:
      'Photosynthesis converts light energy into chemical energy stored in glucose. ' +
      'In the light-dependent reactions, chlorophyll absorbs photons and water is split, ' +
      'releasing oxygen as a by-product. The resulting energy carriers, ATP and NADPH, ' +
      'drive the Calvin cycle, where carbon dioxide is fixed into organic molecules. ' +
      'Although the Calvin cycle does not require light directly, it depends on the products ' +
      'of the light reactions, so the two stages are tightly coupled.',
    questions: [
      {
        id: 'r-photo-q1',
        skill: 'reading',
        difficulty: 3,
        prompt: 'According to the passage, oxygen is released during:',
        options: [
          'the Calvin cycle',
          'carbon fixation',
          'the splitting of water',
          'glucose storage',
        ],
        answerIndex: 2,
        explanation: '本文の "water is split, releasing oxygen" が根拠。',
      },
      {
        id: 'r-photo-q2',
        skill: 'reading',
        difficulty: 4,
        prompt: 'The phrase "tightly coupled" suggests the two stages are:',
        options: ['independent', 'interdependent', 'identical', 'optional'],
        answerIndex: 1,
        explanation: 'Calvin cycle が light reactions の生成物に依存する、という記述から相互依存。',
      },
    ],
  },
];

export interface ListeningLesson {
  id: string;
  difficulty: Difficulty;
  title: string;
  /** Spoken via Web Speech TTS — no audio file shipped. */
  script: string;
  questions: MCQuestion[];
}

export const LISTENING_LESSONS: ListeningLesson[] = [
  {
    id: 'l-urban',
    difficulty: 3,
    title: 'Lecture: Urban Heat Islands',
    script:
      'Today we will discuss urban heat islands. The key point is that cities tend to be ' +
      'warmer than surrounding rural areas. Why? Concrete and asphalt absorb and re-radiate heat, ' +
      'and there is less vegetation to provide cooling through evaporation. As a result, nighttime ' +
      'temperatures in city centers can be several degrees higher than in nearby countryside.',
    questions: [
      {
        id: 'l-urban-q1',
        skill: 'listening',
        difficulty: 3,
        prompt: 'What is the main idea of the lecture?',
        options: [
          'Rural areas are warmer than cities',
          'Cities are warmer than nearby rural areas',
          'Vegetation increases temperature',
          'Asphalt cools the city',
        ],
        answerIndex: 1,
      },
      {
        id: 'l-urban-q2',
        skill: 'listening',
        difficulty: 4,
        prompt: 'Which factor does the professor cite for the effect?',
        options: [
          'More vegetation downtown',
          'Asphalt absorbing and re-radiating heat',
          'Cooler ocean breezes',
          'Lower population density',
        ],
        answerIndex: 1,
      },
    ],
  },
];

export interface SpeakingPrompt {
  id: string;
  difficulty: Difficulty;
  type: 'independent' | 'integrated';
  prompt: string;
  prepSeconds: number;
  speakSeconds: number;
}

export const SPEAKING_PROMPTS: SpeakingPrompt[] = [
  {
    id: 's-indep-1',
    difficulty: 3,
    type: 'independent',
    prompt:
      'Some students prefer studying alone, while others prefer studying in groups. Which do you prefer, and why? Use specific reasons and examples.',
    prepSeconds: 15,
    speakSeconds: 45,
  },
];

export interface WritingPrompt {
  id: string;
  difficulty: Difficulty;
  type: 'independent' | 'integrated';
  prompt: string;
  targetWords: number;
}

export const WRITING_PROMPTS: WritingPrompt[] = [
  {
    id: 'w-indep-1',
    difficulty: 4,
    type: 'independent',
    prompt:
      'Do you agree or disagree with the following statement? "Universities should require all students to take courses outside their major." Use specific reasons and examples to support your answer.',
    targetWords: 300,
  },
];
