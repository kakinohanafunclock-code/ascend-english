/** Web Speech API helpers (TTS + STT) with feature detection. Zero audio assets. */

export function isTtsSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function speak(text: string, opts: { rate?: number; lang?: string } = {}): void {
  if (!isTtsSupported()) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = opts.lang ?? 'en-US';
  utter.rate = opts.rate ?? 0.95;
  synth.speak(utter);
}

export function stopSpeaking(): void {
  if (isTtsSupported()) window.speechSynthesis.cancel();
}

type SpeechRecognitionCtor = new () => {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: unknown) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isSttSupported(): boolean {
  return getRecognitionCtor() !== null;
}

export interface Recorder {
  stop(): void;
}

/**
 * Start speech-to-text. Returns a handle to stop, or null if unsupported (callers
 * then fall back to manual text entry). Transcripts accumulate across results.
 */
export function startRecognition(
  onTranscript: (text: string) => void,
  onEnd?: () => void,
): Recorder | null {
  const Ctor = getRecognitionCtor();
  if (!Ctor) return null;
  const rec = new Ctor();
  rec.lang = 'en-US';
  rec.continuous = true;
  rec.interimResults = true;
  rec.onresult = (e) => {
    let text = '';
    for (let i = 0; i < e.results.length; i++) {
      text += e.results[i][0].transcript;
    }
    onTranscript(text.trim());
  };
  rec.onend = () => onEnd?.();
  rec.onerror = () => onEnd?.();
  rec.start();
  return { stop: () => rec.stop() };
}
