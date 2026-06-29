import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  Repository,
  type Profile,
  type Settings,
} from '../data/repository';
import {
  estimateSkillScores,
  estimateToefl,
  generateCurriculum,
  createWord,
  reviewWord,
  hasTerm,
  type Attempt,
  type Curriculum,
  type DiagnosticAnswer,
  type ReviewGrade,
  type VocabSeedInput,
  type VocabWord,
} from '../domain';
import { VOCAB_DECK } from '../content';
import {
  createCloudSync,
  supabaseConfigured,
  getSyncCode,
  setSyncCode,
  generateSyncCode,
  normalizeSyncCode,
} from '../data/supabase';
import { createConfiguredAiClient } from '../ai';
import type { AiClient } from '../ai/client';
import {
  scheduleDailyReminder,
  cancelDailyReminder,
  notificationPermission,
} from '../notifications/reminders';

interface AppState {
  loading: boolean;
  profile: Profile | null;
  settings: Settings;
  attempts: Attempt[];
  curriculum: Curriculum | null;
  vocab: VocabWord[];
  ai: AiClient;
  completeDiagnostic: (answers: DiagnosticAnswer[]) => Promise<void>;
  recordAttempt: (attempt: Attempt) => Promise<void>;
  updateSettings: (patch: Partial<Settings>) => Promise<void>;
  addVocabWord: (seed: VocabSeedInput) => Promise<{ added: boolean }>;
  reviewVocabWord: (word: VocabWord, grade: ReviewGrade) => Promise<void>;
  removeVocabWord: (id: string) => Promise<void>;
  seedVocabDeck: () => Promise<void>;
  cloudConfigured: boolean;
  syncCode: string | null;
  syncNow: () => Promise<void>;
  enableCloudSync: () => Promise<string>;
  linkWithCode: (code: string) => Promise<{ pulled: boolean }>;
  resetAll: () => Promise<void>;
}

const AppContext = createContext<AppState | null>(null);

export interface AppProviderProps {
  children: ReactNode;
  /** Injectable for tests. */
  repo?: Repository;
  ai?: AiClient;
}

export function AppProvider({ children, repo, ai }: AppProviderProps) {
  const repository = useMemo(() => repo ?? new Repository(), [repo]);
  const aiClient = useMemo(() => {
    if (ai) return ai;
    return createConfiguredAiClient({
      get: (k) => repository.getAiCache(k),
      set: (k, v) => repository.setAiCache(k, v),
    });
  }, [ai, repository]);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [curriculum, setCurriculum] = useState<Curriculum | null>(null);
  const [vocab, setVocab] = useState<VocabWord[]>([]);
  const [syncCode, setSyncCodeState] = useState<string | null>(getSyncCode());

  /** Re-read all persisted state into React state (after a load or a cloud pull). */
  async function reloadFromRepo(): Promise<void> {
    const [p, s, a, c, v] = await Promise.all([
      repository.getProfile(),
      repository.getSettings(),
      repository.getAttempts(),
      repository.getCurriculum(),
      repository.getVocab(),
    ]);
    setProfile(p ?? null);
    setSettings(s);
    setAttempts(a);
    setCurriculum(c ?? null);
    setVocab(v);
  }

  useEffect(() => {
    let active = true;
    (async () => {
      // Optional cloud pull (last-write-wins) before reading local state.
      const pre = await repository.getSettings();
      if (pre.cloudSyncEnabled && supabaseConfigured()) {
        try {
          const remote = await createCloudSync()?.pull();
          if (remote) await repository.importAll(remote.data);
        } catch {
          /* offline / not provisioned — stay local */
        }
      }
      if (!active) return;
      await reloadFromRepo();
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [repository]);

  // Keep the daily reminder loop in sync with settings whenever the app is open.
  useEffect(() => {
    if (settings?.reminderEnabled && notificationPermission() === 'granted') {
      scheduleDailyReminder(settings.reminderTime);
    } else {
      cancelDailyReminder();
    }
    return () => cancelDailyReminder();
  }, [settings?.reminderEnabled, settings?.reminderTime]);

  async function completeDiagnostic(answers: DiagnosticAnswer[]): Promise<void> {
    const sections = estimateSkillScores(answers);
    const toefl = estimateToefl(sections);
    const settled = settings ?? (await repository.getSettings());
    const sectionScores = {
      reading: sections.reading.score,
      listening: sections.listening.score,
      speaking: sections.speaking.score,
      writing: sections.writing.score,
    };
    const newProfile: Profile = {
      goalScore: settled.goalScore,
      createdAt: new Date().toISOString(),
      diagnostic: sectionScores,
      estimatedToefl: toefl.total,
      estimatedSections: sectionScores,
    };
    const newCurriculum = generateCurriculum({
      startScores: sectionScores,
      goalScore: settled.goalScore,
      weeks: 8,
      startDateISO: new Date().toISOString().slice(0, 10),
    });
    await repository.saveProfile(newProfile);
    await repository.saveCurriculum(newCurriculum);
    setProfile(newProfile);
    setCurriculum(newCurriculum);
  }

  async function recordAttempt(attempt: Attempt): Promise<void> {
    await repository.addAttempt(attempt);
    setAttempts((prev) => [...prev, attempt]);
  }

  async function updateSettings(patch: Partial<Settings>): Promise<void> {
    const next = await repository.saveSettings(patch);
    setSettings(next);
  }

  async function addVocabWord(seed: VocabSeedInput): Promise<{ added: boolean }> {
    if (hasTerm(vocab, seed.term)) return { added: false };
    const next = await repository.addWord(createWord(seed));
    setVocab(next);
    return { added: true };
  }

  async function reviewVocabWord(word: VocabWord, grade: ReviewGrade): Promise<void> {
    const next = await repository.updateWord(reviewWord(word, grade));
    setVocab(next);
  }

  async function removeVocabWord(id: string): Promise<void> {
    const next = await repository.removeWord(id);
    setVocab(next);
  }

  async function seedVocabDeck(): Promise<void> {
    let current = vocab;
    for (const seed of VOCAB_DECK) {
      if (!hasTerm(current, seed.term)) {
        current = await repository.addWord(createWord(seed));
      }
    }
    setVocab(current);
  }

  async function syncNow(): Promise<void> {
    const sync = createCloudSync();
    if (!sync) return;
    await sync.push(await repository.exportAll());
  }

  /** Turn on sync for THIS device: ensure a shared code exists, then push. */
  async function enableCloudSync(): Promise<string> {
    let code = getSyncCode();
    if (!code) {
      code = generateSyncCode();
      setSyncCode(code);
    }
    setSyncCodeState(getSyncCode());
    await repository.saveSettings({ cloudSyncEnabled: true });
    setSettings(await repository.getSettings());
    await syncNow();
    return code;
  }

  /** Link this device to another's data by entering its sync code, then pull. */
  async function linkWithCode(code: string): Promise<{ pulled: boolean }> {
    setSyncCode(normalizeSyncCode(code));
    setSyncCodeState(getSyncCode());
    await repository.saveSettings({ cloudSyncEnabled: true });
    const sync = createCloudSync();
    let pulled = false;
    if (sync) {
      const remote = await sync.pull();
      if (remote) {
        await repository.importAll(remote.data);
        pulled = true;
      }
    }
    await reloadFromRepo();
    return { pulled };
  }

  async function resetAll(): Promise<void> {
    await repository.clearAll();
    setProfile(null);
    setCurriculum(null);
    setAttempts([]);
    setVocab([]);
    setSettings(await repository.getSettings());
  }

  if (loading || !settings) {
    return (
      <div className="min-h-screen grid place-items-center text-ink-subtle text-small">
        読み込み中…
      </div>
    );
  }

  const value: AppState = {
    loading,
    profile,
    settings,
    attempts,
    curriculum,
    vocab,
    ai: aiClient,
    completeDiagnostic,
    recordAttempt,
    updateSettings,
    addVocabWord,
    reviewVocabWord,
    removeVocabWord,
    seedVocabDeck,
    cloudConfigured: supabaseConfigured(),
    syncCode,
    syncNow,
    enableCloudSync,
    linkWithCode,
    resetAll,
  };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
