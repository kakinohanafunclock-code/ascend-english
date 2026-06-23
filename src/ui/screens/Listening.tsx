import { useState } from 'react';
import { Play, Square, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../../app/store';
import { Quiz, type QuizResult } from '../components/Quiz';
import { LISTENING_LESSONS } from '../../content';
import { speak, stopSpeaking, isTtsSupported } from '../../lib/speech';
import { makeAttempt, sectionScoreFromItems } from '../lib/record';

export function Listening() {
  const { recordAttempt } = useApp();
  const lesson = LISTENING_LESSONS[0];
  const [playing, setPlaying] = useState(false);
  const [showScript, setShowScript] = useState(false);
  const [done, setDone] = useState<QuizResult | null>(null);
  const supported = isTtsSupported();

  function play() {
    setPlaying(true);
    speak(lesson.script, { rate: 0.95 });
    // SpeechSynthesis has no reliable end callback across browsers; reset shortly.
    window.setTimeout(() => setPlaying(false), Math.min(60000, lesson.script.length * 60));
  }
  function stop() {
    stopSpeaking();
    setPlaying(false);
  }

  async function onComplete(result: QuizResult) {
    setDone(result);
    setShowScript(true);
    await recordAttempt(
      makeAttempt({
        skill: 'listening',
        taskId: lesson.id,
        durationMin: lesson.estimatedMinutes,
        accuracy: result.accuracy,
        score: sectionScoreFromItems('listening', result.items),
      }),
    );
  }

  return (
    <div className="max-w-2xl flex flex-col gap-6">
      <div className="card card-pad">
        <p className="eyebrow mb-1">Listening · 難易度 {lesson.difficulty}</p>
        <h2 className="text-h2 font-semibold mb-4">{lesson.title}</h2>
        <div className="flex items-center gap-3">
          {!playing ? (
            <button className="btn-primary inline-flex w-auto" onClick={play} disabled={!supported}>
              <Play size={16} /> 音声を再生
            </button>
          ) : (
            <button className="btn-secondary inline-flex w-auto" onClick={stop}>
              <Square size={16} /> 停止
            </button>
          )}
          <button
            className="btn-ghost inline-flex w-auto"
            onClick={() => setShowScript((s) => !s)}
          >
            {showScript ? <EyeOff size={15} /> : <Eye size={15} />}
            スクリプト{showScript ? 'を隠す' : 'を表示'}
          </button>
        </div>
        {!supported && (
          <p className="text-small text-warning mt-3">
            このブラウザは音声合成 (TTS) に未対応です。スクリプトを表示して学習してください。
          </p>
        )}
        {showScript && (
          <p className="font-serif leading-relaxed text-ink mt-4 border-t border-line pt-4">
            {lesson.script}
          </p>
        )}
      </div>

      <Quiz questions={lesson.questions} onComplete={onComplete} />

      {done && (
        <div className="card card-pad">
          <p className="text-small text-ink-muted">
            正答 {done.correctCount}/{done.items.length}。スクリプトを表示して聞き取れなかった箇所を確認しましょう。
          </p>
        </div>
      )}
    </div>
  );
}
