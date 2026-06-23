/** Seed vocabulary for the word-learning module. Academic / TOEFL-frequent words. */
export interface VocabSeed {
  term: string;
  meaning: string; // Japanese
  example: string; // English usage
  pos?: string; // part of speech
}

export const VOCAB_DECK: VocabSeed[] = [
  { term: 'arbitrary', pos: 'adj.', meaning: '恣意的な、任意の', example: 'The deadline felt arbitrary and unfair.' },
  { term: 'mitigate', pos: 'v.', meaning: '軽減する、和らげる', example: 'Planting trees can mitigate urban heat.' },
  { term: 'coherent', pos: 'adj.', meaning: '首尾一貫した', example: 'A coherent essay flows logically.' },
  { term: 'empirical', pos: 'adj.', meaning: '経験的・実証的な', example: 'The claim lacks empirical evidence.' },
  { term: 'plausible', pos: 'adj.', meaning: 'もっともらしい、妥当な', example: 'That is a plausible explanation.' },
  { term: 'inevitable', pos: 'adj.', meaning: '避けられない', example: 'Change is inevitable over time.' },
  { term: 'ambiguous', pos: 'adj.', meaning: '曖昧な、多義的な', example: 'The instructions were ambiguous.' },
  { term: 'undermine', pos: 'v.', meaning: '徐々に弱める、損なう', example: 'Errors undermine the report’s credibility.' },
  { term: 'compelling', pos: 'adj.', meaning: '説得力のある、強烈な', example: 'She made a compelling argument.' },
  { term: 'feasible', pos: 'adj.', meaning: '実行可能な', example: 'The plan is technically feasible.' },
  { term: 'comprehensive', pos: 'adj.', meaning: '包括的な', example: 'A comprehensive review of the data.' },
  { term: 'discrepancy', pos: 'n.', meaning: '食い違い、相違', example: 'There is a discrepancy between the figures.' },
  { term: 'paradigm', pos: 'n.', meaning: 'パラダイム、枠組み', example: 'A new paradigm in physics.' },
  { term: 'reluctant', pos: 'adj.', meaning: '気が進まない', example: 'He was reluctant to agree.' },
  { term: 'scrutiny', pos: 'n.', meaning: '精査、綿密な調査', example: 'The budget came under scrutiny.' },
  { term: 'viable', pos: 'adj.', meaning: '存続可能な、実行可能な', example: 'A viable business model.' },
  { term: 'nuance', pos: 'n.', meaning: '微妙な差異', example: 'He missed the nuance of the phrase.' },
  { term: 'prevalent', pos: 'adj.', meaning: '広く行き渡った', example: 'The view is prevalent among experts.' },
  { term: 'substantiate', pos: 'v.', meaning: '実証する、裏付ける', example: 'Data substantiate the hypothesis.' },
  { term: 'tentative', pos: 'adj.', meaning: '暫定的な、ためらいがちな', example: 'A tentative conclusion.' },
];
