import { useRef, useState } from 'react';
import { Mic, Square, Sparkles, Loader2 } from 'lucide-react';
import { useApp } from '../../app/store';
import { SPEAKING_PROMPTS } from '../../content';
import { correctSpeaking, type SpeakingFeedback } from '../../ai';
import { hasTerm } from '../../domain';
import { startRecognition, isSttSupported, type Recorder } from '../../lib/speech';
import { FeedbackPanel } from '../components/FeedbackPanel';
import { makeAttempt } from '../lib/record';

export function Speaking() {
  const { ai, recordAttempt, vocab, addVocabWord } = useApp();
  const task = SPEAKING_PROMPTS[0];
  const recorderRef = useRef<Recorder | null>(null);
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState<SpeakingFeedback | null>(null);
  const [loading, setLoading] = useState(false);
  const supported = isSttSupported();

  function toggleRecord() {
    if (recording) {
      recorderRef.current?.stop();
      recorderRef.current = null;
      setRecording(false);
      return;
    }
    const rec = startRecognition(
      (text) => setTranscript(text),
      () => setRecording(false),
    );
    if (rec) {
      recorderRef.current = rec;
      setRecording(true);
    }
  }

  async function submit() {
    setLoading(true);
    const fb = await correctSpeaking(ai, { prompt: task.prompt, transcript });
    setFeedback(fb);
    setLoading(false);
    await recordAttempt(
      makeAttempt({ skill: 'speaking', taskId: task.id, durationMin: task.estimatedMinutes, score: fb.toeflScaled }),
    );
  }

  return (
    <div className="max-w-2xl flex flex-col gap-6">
      <div className="card card-pad">
        <p className="eyebrow mb-1">Speaking · {task.type} · 準備{task.prepSeconds}秒 / 発話{task.speakSeconds}秒</p>
        <p className="font-medium mt-2">{task.prompt}</p>
      </div>

      <div className="card card-pad flex flex-col gap-4">
        <div className="flex items-center gap-3">
          {supported ? (
            <button
              className={recording ? 'btn-secondary inline-flex w-auto' : 'btn-primary inline-flex w-auto'}
              onClick={toggleRecord}
            >
              {recording ? <Square size={16} /> : <Mic size={16} />}
              {recording ? '録音停止' : '録音開始（音声認識）'}
            </button>
          ) : (
            <span className="text-small text-warning">
              このブラウザは音声認識 (STT) に未対応です。下に直接入力してください。
            </span>
          )}
          {recording && <span className="text-small text-accent animate-pulse">● 認識中…</span>}
        </div>

        <div>
          <label className="field-label" htmlFor="sp-transcript">
            文字起こし（編集可）
          </label>
          <textarea
            id="sp-transcript"
            className="input min-h-32 resize-y font-serif"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="ここに音声認識の結果が表示されます。手入力も可能です。"
          />
        </div>

        <button
          className="btn-primary self-start"
          onClick={submit}
          disabled={loading || transcript.trim().length === 0}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          AI 添削を受ける
        </button>
      </div>

      {feedback && (
        <FeedbackPanel
          toeflScaled={feedback.toeflScaled}
          rubric={[
            { label: 'Delivery', value: feedback.rubric.delivery },
            { label: 'Language Use', value: feedback.rubric.languageUse },
            { label: 'Topic Dev.', value: feedback.rubric.topicDevelopment },
          ]}
          strengths={feedback.strengths}
          improvements={feedback.improvements}
          translationJa={feedback.translationJa}
          glossary={feedback.glossary}
          onAddWord={(g) => addVocabWord(g)}
          isSaved={(term) => hasTerm(vocab, term)}
          source={feedback.source}
        />
      )}
    </div>
  );
}
