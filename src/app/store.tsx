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
  type Attempt,
  type Curriculum,
  type DiagnosticAnswer,
} from '../domain';
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
  ai: AiClient;
  completeDiagnostic: (answers: DiagnosticAnswer[]) => Promise<void>;
  recordAttempt: (attempt: Attempt) => Promise<void>;
  updateSettings: (patch: Partial<Settings>) => Promise<void>;
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

  useEffect(() => {
    let active = true;
    (async () => {
      const [p, s, a, c] = await Promise.all([
        repository.getProfile(),
        repository.getSettings(),
        repository.getAttempts(),
        repository.getCurriculum(),
      ]);
      if (!active) return;
      setProfile(p ?? null);
      setSettings(s);
      setAttempts(a);
      setCurriculum(c ?? null);
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

  async function resetAll(): Promise<void> {
    await repository.clearAll();
    setProfile(null);
    setCurriculum(null);
    setAttempts([]);
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
    ai: aiClient,
    completeDiagnostic,
    recordAttempt,
    updateSettings,
    resetAll,
  };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
