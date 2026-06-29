import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { AppProvider, useApp } from './app/store';
import { AppShell } from './ui/components/AppShell';
import { Diagnostic } from './ui/screens/Diagnostic';
import { Dashboard } from './ui/screens/Dashboard';
import { Today } from './ui/screens/Today';
import { Reading } from './ui/screens/Reading';
import { Listening } from './ui/screens/Listening';
import { Speaking } from './ui/screens/Speaking';
import { Writing } from './ui/screens/Writing';
import { Vocabulary } from './ui/screens/Vocabulary';
import { Settings } from './ui/screens/Settings';

function Root() {
  const { profile } = useApp();
  return <Navigate to={profile ? '/dashboard' : '/diagnostic'} replace />;
}

function DiagnosticPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-line" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="mx-auto max-w-content px-4 md:px-10 py-4 flex items-center gap-2">
          <span className="grid place-items-center w-7 h-7 rounded-token bg-accent text-white">
            <GraduationCap size={16} />
          </span>
          <span className="font-semibold">Ascend</span>
        </div>
      </header>
      <div className="mx-auto max-w-content px-4 md:px-10 py-6 md:py-10">
        <Diagnostic />
      </div>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}

function Routed() {
  const location = useLocation();
  // Diagnostic is a focused, shell-less flow.
  if (location.pathname === '/diagnostic') {
    return (
      <Routes>
        <Route path="/diagnostic" element={<DiagnosticPage />} />
      </Routes>
    );
  }
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Root />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/today" element={<Today />} />
        <Route path="/reading" element={<Reading />} />
        <Route path="/listening" element={<Listening />} />
        <Route path="/speaking" element={<Speaking />} />
        <Route path="/writing" element={<Writing />} />
        <Route path="/vocabulary" element={<Vocabulary />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Routed />
    </AppProvider>
  );
}
