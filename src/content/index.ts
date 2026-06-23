import type { Difficulty, Skill } from '../domain/types';

/** A multiple-choice diagnostic/lesson item. */
export interface MCQuestion {
  id: string;
  skill: Skill;
  difficulty: Difficulty;
  prompt: string;
  options: string[];
  answerIndex: number;
  /** Japanese explanation shown after grading. */
  explanation?: string;
}

/** Estimated minutes a completed unit contributes to study time, by skill. */
export const TASK_MINUTES: Record<Skill, number> = {
  reading: 15,
  listening: 15,
  speaking: 10,
  writing: 20,
};

/**
 * Diagnostic items — several per skill. Reading/Listening are comprehension MCQs;
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
    explanation: 'defer = 「延期する」。postpone と同義です。',
  },
  {
    id: 'd-r2',
    skill: 'reading',
    difficulty: 4,
    prompt:
      'A passage argues a hypothesis is "not without merit, yet far from conclusive." This implies the author is:',
    options: ['fully convinced', 'entirely dismissive', 'cautiously skeptical', 'indifferent'],
    answerIndex: 2,
    explanation: '「価値がなくはないが決定的とは程遠い」＝慎重に懐疑的、という含み。',
  },
  {
    id: 'd-r3',
    skill: 'reading',
    difficulty: 5,
    prompt:
      'Which transition best signals a counterargument: "___, the data suggest the opposite trend."',
    options: ['Consequently', 'Nonetheless', 'Therefore', 'Likewise'],
    answerIndex: 1,
    explanation: 'Nonetheless = 「それにもかかわらず」。逆接で反論を導きます。',
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
    explanation: 'table（米）= 「いったん棚上げにする」。後回しの意味。',
  },
  {
    id: 'd-l2',
    skill: 'listening',
    difficulty: 3,
    prompt:
      'A lecturer stresses "the KEY point here" before a sentence. This intonation usually marks:',
    options: ['a digression', 'an example only', 'the main idea', 'a correction'],
    answerIndex: 2,
    explanation: '強勢で「the KEY point」と言う＝要点（main idea）の合図。',
  },
  {
    id: 'd-l3',
    skill: 'listening',
    difficulty: 4,
    prompt: 'A student asks for clarification; the professor replies, "Precisely." The professor is:',
    options: ['disagreeing', 'confirming', 'changing topic', 'asking back'],
    answerIndex: 1,
    explanation: 'Precisely = 「まさにその通り」。確認・同意を表します。',
  },
  // Speaking (objective proxy)
  {
    id: 'd-s1',
    skill: 'speaking',
    difficulty: 3,
    prompt: 'Which opening best frames a 45-second independent response?',
    options: [
      "Um, I think maybe it is good, I don't know.",
      'I strongly prefer studying abroad for two main reasons.',
      'There are many things to say about this topic.',
      'Yes.',
    ],
    answerIndex: 1,
    explanation: '立場＋理由数を冒頭で明示すると構成が明確になります。',
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
    explanation: 'Because … consequently … と因果の標識語が明確です。',
  },
  // Writing (objective proxy)
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
    explanation: 'despite of は誤り。譲歩は Although + 節 が正しい形。',
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
    explanation: 'as a result で因果を明示し、2文を結束させています。',
  },
];

// ---------------- Reading ----------------

export interface ReadingLesson {
  id: string;
  difficulty: Difficulty;
  title: string;
  passage: string;
  /** Static Japanese translation shown on demand (instant, cost-free). */
  translationJa: string;
  estimatedMinutes: number;
  questions: MCQuestion[];
}

export const READING_LESSONS: ReadingLesson[] = [
  {
    id: 'r-photosynthesis',
    difficulty: 3,
    title: 'Photosynthesis and Carbon Fixation',
    estimatedMinutes: 15,
    passage:
      'Photosynthesis converts light energy into chemical energy stored in glucose. ' +
      'In the light-dependent reactions, chlorophyll absorbs photons and water is split, ' +
      'releasing oxygen as a by-product. The resulting energy carriers, ATP and NADPH, ' +
      'drive the Calvin cycle, where carbon dioxide is fixed into organic molecules. ' +
      'Although the Calvin cycle does not require light directly, it depends on the products ' +
      'of the light reactions, so the two stages are tightly coupled.',
    translationJa:
      '光合成は光エネルギーを、グルコースに蓄えられる化学エネルギーへと変換する。光に依存する反応では、' +
      'クロロフィルが光子を吸収し、水が分解されて副産物として酸素が放出される。生じたエネルギー運搬体である' +
      'ATP と NADPH がカルビン回路を駆動し、そこで二酸化炭素が有機分子へと固定される。カルビン回路は直接' +
      '光を必要としないが、光反応の生成物に依存するため、2 つの段階は密接に結びついている。',
    questions: [
      {
        id: 'r-photo-q1',
        skill: 'reading',
        difficulty: 3,
        prompt: 'According to the passage, oxygen is released during:',
        options: ['the Calvin cycle', 'carbon fixation', 'the splitting of water', 'glucose storage'],
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
        explanation: 'Calvin cycle が light reactions の生成物に依存する＝相互依存。',
      },
    ],
  },
  {
    id: 'r-marketfailure',
    difficulty: 4,
    title: 'Externalities and Market Failure',
    estimatedMinutes: 15,
    passage:
      'In economics, an externality is a cost or benefit imposed on a third party who did not ' +
      'choose to incur it. When a factory pollutes a river, the harm to downstream communities is a ' +
      'negative externality not reflected in the factory\'s private costs. Because the market price ' +
      'omits this social cost, the good is overproduced relative to the socially optimal level. ' +
      'Governments may correct such market failures through taxes, tradable permits, or regulation, ' +
      'each of which attempts to internalize the external cost.',
    translationJa:
      '経済学において外部性とは、それを負担すると選んだわけではない第三者に課される費用や便益のことである。' +
      '工場が川を汚染すると、下流の地域社会への損害は、工場の私的費用に反映されない負の外部性となる。市場価格が' +
      'この社会的費用を含まないため、その財は社会的に最適な水準よりも過剰に生産される。政府は課税・取引可能な' +
      '排出権・規制などによってこうした市場の失敗を是正しようとし、いずれも外部費用の内部化を試みるものである。',
    questions: [
      {
        id: 'r-mkt-q1',
        skill: 'reading',
        difficulty: 4,
        prompt: 'A negative externality causes a good to be:',
        options: ['underproduced', 'overproduced', 'priced fairly', 'banned'],
        answerIndex: 1,
        explanation: '社会的費用が価格に含まれないため過剰生産になる、と本文にある。',
      },
      {
        id: 'r-mkt-q2',
        skill: 'reading',
        difficulty: 5,
        prompt: 'To "internalize the external cost" most nearly means to:',
        options: [
          'hide the cost from consumers',
          'make the producer bear the social cost',
          'eliminate all production',
          'subsidize the factory',
        ],
        answerIndex: 1,
        explanation: 'internalize＝外部費用を生産者の負担に取り込むこと。',
      },
    ],
  },
];

// ---------------- Listening ----------------

export interface ListeningLesson {
  id: string;
  difficulty: Difficulty;
  title: string;
  /** Spoken via Web Speech TTS — no audio file shipped. */
  script: string;
  translationJa: string;
  estimatedMinutes: number;
  questions: MCQuestion[];
}

export const LISTENING_LESSONS: ListeningLesson[] = [
  {
    id: 'l-urban',
    difficulty: 3,
    title: 'Lecture: Urban Heat Islands',
    estimatedMinutes: 15,
    script:
      'Today we will discuss urban heat islands. The key point is that cities tend to be ' +
      'warmer than surrounding rural areas. Why? Concrete and asphalt absorb and re-radiate heat, ' +
      'and there is less vegetation to provide cooling through evaporation. As a result, nighttime ' +
      'temperatures in city centers can be several degrees higher than in nearby countryside.',
    translationJa:
      '今日はヒートアイランド現象について論じます。要点は、都市は周辺の郊外より暖かくなりやすいということです。' +
      'なぜでしょうか。コンクリートやアスファルトが熱を吸収して再放射し、蒸発による冷却をもたらす植生が少ない' +
      'からです。その結果、都心部の夜間気温は近隣の郊外より数度高くなることがあります。',
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
        explanation: '冒頭で都市が郊外より暖かいと述べています。',
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
        explanation: 'アスファルトが熱を吸収・再放射するため、と説明されています。',
      },
    ],
  },
  {
    id: 'l-sleep',
    difficulty: 4,
    title: 'Lecture: Sleep and Memory Consolidation',
    estimatedMinutes: 15,
    script:
      'Let me turn to why sleep matters for learning. During deep sleep, the brain replays ' +
      'the neural patterns formed while you studied, strengthening the connections between neurons. ' +
      'This process, called consolidation, moves fragile new memories into more stable long-term ' +
      'storage. So pulling an all-nighter before an exam can actually backfire: without sleep, much ' +
      'of what you reviewed never gets consolidated.',
    translationJa:
      '次に、なぜ睡眠が学習に重要なのかに移ります。深い睡眠の間、脳は勉強中に形成された神経パターンを再生し、' +
      'ニューロン間の結合を強化します。この過程は固定化（consolidation）と呼ばれ、不安定な新しい記憶を、より' +
      '安定した長期保存へと移します。ですから試験前の徹夜はむしろ逆効果になり得ます。睡眠なしでは復習した内容の' +
      '多くが固定化されないのです。',
    questions: [
      {
        id: 'l-sleep-q1',
        skill: 'listening',
        difficulty: 4,
        prompt: 'What does "consolidation" refer to?',
        options: [
          'Forgetting irrelevant facts',
          'Stabilizing new memories during sleep',
          'Studying all night',
          'Replaying music',
        ],
        answerIndex: 1,
        explanation: '睡眠中に新しい記憶を安定化させる過程＝consolidation。',
      },
      {
        id: 'l-sleep-q2',
        skill: 'listening',
        difficulty: 4,
        prompt: 'Why can an all-nighter "backfire"?',
        options: [
          'It wastes money',
          'Reviewed material is not consolidated without sleep',
          'It improves memory too much',
          'It replays neural patterns twice',
        ],
        answerIndex: 1,
        explanation: '睡眠がないと復習内容が固定化されないため。',
      },
    ],
  },
];

// ---------------- Speaking ----------------

export interface SpeakingPrompt {
  id: string;
  difficulty: Difficulty;
  type: 'independent' | 'integrated';
  prompt: string;
  prepSeconds: number;
  speakSeconds: number;
  estimatedMinutes: number;
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
    estimatedMinutes: 10,
  },
  {
    id: 's-indep-2',
    difficulty: 4,
    type: 'independent',
    prompt:
      'Do you agree or disagree: "It is better to have a few close friends than many casual acquaintances." Explain with reasons and examples.',
    prepSeconds: 15,
    speakSeconds: 45,
    estimatedMinutes: 10,
  },
];

// ---------------- Writing ----------------

export interface WritingPrompt {
  id: string;
  difficulty: Difficulty;
  type: 'independent' | 'integrated';
  prompt: string;
  targetWords: number;
  estimatedMinutes: number;
}

export const WRITING_PROMPTS: WritingPrompt[] = [
  {
    id: 'w-indep-1',
    difficulty: 4,
    type: 'independent',
    prompt:
      'Do you agree or disagree with the following statement? "Universities should require all students to take courses outside their major." Use specific reasons and examples to support your answer.',
    targetWords: 300,
    estimatedMinutes: 20,
  },
  {
    id: 'w-indep-2',
    difficulty: 5,
    type: 'independent',
    prompt:
      'Some people believe technology has made people less social. Others disagree. Discuss both views and give your own opinion with specific examples.',
    targetWords: 300,
    estimatedMinutes: 20,
  },
];

export { VOCAB_DECK } from './vocab';
export type { VocabSeed } from './vocab';
