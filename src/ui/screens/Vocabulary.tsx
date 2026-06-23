import { useMemo, useState } from 'react';
import { Plus, Check, X, Trash2, Layers, BookMarked, RotateCcw, Sparkles } from 'lucide-react';
import { useApp } from '../../app/store';
import { dueWords, vocabStats, type VocabWord } from '../../domain';
import { StatCard } from '../components/Charts';

export function Vocabulary() {
  const { vocab, addVocabWord, reviewVocabWord, removeVocabWord, seedVocabDeck } = useApp();
  const stats = useMemo(() => vocabStats(vocab), [vocab]);

  const [session, setSession] = useState<VocabWord[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [term, setTerm] = useState('');
  const [meaning, setMeaning] = useState('');

  function start() {
    const due = dueWords(vocab);
    if (due.length === 0) return;
    setSession(due);
    setIdx(0);
    setRevealed(false);
  }

  async function grade(g: 'again' | 'good') {
    if (!session) return;
    await reviewVocabWord(session[idx], g);
    if (idx + 1 >= session.length) {
      setSession(null);
    } else {
      setIdx(idx + 1);
      setRevealed(false);
    }
  }

  async function add() {
    if (!term.trim() || !meaning.trim()) return;
    await addVocabWord({ term, meaning });
    setTerm('');
    setMeaning('');
  }

  // --- Review session view ---
  if (session) {
    const card = session[idx];
    return (
      <div className="max-w-xl flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <span className="eyebrow">復習 {idx + 1} / {session.length}</span>
          <button className="btn-ghost inline-flex w-auto" onClick={() => setSession(null)}>
            終了
          </button>
        </div>
        <div className="card card-pad min-h-56 flex flex-col items-center justify-center text-center gap-3">
          {card.pos && <span className="tag">{card.pos}</span>}
          <p className="text-display font-semibold">{card.term}</p>
          {revealed ? (
            <div className="flex flex-col gap-2">
              <p className="text-h2">{card.meaning}</p>
              {card.example && <p className="text-small text-ink-muted font-serif">“{card.example}”</p>}
            </div>
          ) : (
            <button className="btn-secondary inline-flex w-auto" onClick={() => setRevealed(true)}>
              意味を表示
            </button>
          )}
        </div>
        {revealed && (
          <div className="grid grid-cols-2 gap-3">
            <button className="btn-secondary text-critical border-critical" onClick={() => grade('again')}>
              <X size={16} /> もう一度
            </button>
            <button className="btn-primary" onClick={() => grade('good')}>
              <Check size={16} /> 覚えた
            </button>
          </div>
        )}
      </div>
    );
  }

  // --- Overview view ---
  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <section className="grid grid-cols-3 gap-4">
        <StatCard label="登録単語" value={stats.total} icon={<BookMarked size={16} />} />
        <StatCard label="今日の復習" value={stats.due} icon={<RotateCcw size={16} />} />
        <StatCard label="習得済み" value={stats.mastered} icon={<Layers size={16} />} />
      </section>

      <section className="card card-pad flex items-center justify-between">
        <div>
          <h2 className="text-h2 font-semibold">単語復習（SRS）</h2>
          <p className="text-small text-ink-muted mt-1">
            {stats.due > 0 ? `${stats.due} 語が復習待ちです。` : '今日の復習は完了しています。'}
          </p>
        </div>
        <button className="btn-primary inline-flex w-auto" onClick={start} disabled={stats.due === 0}>
          <Sparkles size={16} /> 復習を始める
        </button>
      </section>

      {vocab.length === 0 && (
        <section className="card card-pad flex items-center justify-between">
          <p className="text-small text-ink-muted">まずは TOEFL 頻出の基本デッキを追加しましょう。</p>
          <button className="btn-secondary inline-flex w-auto" onClick={() => seedVocabDeck()}>
            <Plus size={15} /> 基本デッキを追加
          </button>
        </section>
      )}

      {/* Add a word manually */}
      <section className="card card-pad flex flex-col gap-3">
        <h2 className="text-h2 font-semibold">単語を追加</h2>
        <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-2 items-end">
          <div>
            <label className="field-label" htmlFor="v-term">単語</label>
            <input id="v-term" className="input" value={term} onChange={(e) => setTerm(e.target.value)} placeholder="mitigate" />
          </div>
          <div>
            <label className="field-label" htmlFor="v-meaning">意味（日本語）</label>
            <input id="v-meaning" className="input" value={meaning} onChange={(e) => setMeaning(e.target.value)} placeholder="軽減する" />
          </div>
          <button className="btn-primary" onClick={add} disabled={!term.trim() || !meaning.trim()}>
            <Plus size={15} /> 追加
          </button>
        </div>
      </section>

      {/* Word list */}
      {vocab.length > 0 && (
        <section className="card card-pad">
          <h2 className="text-h2 font-semibold mb-4">単語帳（{vocab.length}）</h2>
          <ul className="flex flex-col divide-y divide-line">
            {vocab.map((w) => (
              <li key={w.id} className="flex items-center gap-3 py-2.5">
                <span className="tag shrink-0">Box {w.box}</span>
                <div className="flex-1 min-w-0">
                  <span className="font-medium">{w.term}</span>
                  <span className="text-ink-muted text-small"> — {w.meaning}</span>
                </div>
                <span className="text-micro text-ink-subtle whitespace-nowrap">次回 {w.due}</span>
                <button
                  className="text-ink-subtle hover:text-critical transition-colors"
                  aria-label={`${w.term} を削除`}
                  onClick={() => removeVocabWord(w.id)}
                >
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
