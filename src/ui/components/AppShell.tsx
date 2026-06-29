import { NavLink, useLocation } from 'react-router-dom';
import { useEffect, useState, type ReactNode } from 'react';
import {
  LayoutDashboard,
  CalendarCheck,
  BookOpen,
  Headphones,
  Mic,
  PenLine,
  BookMarked,
  Settings as SettingsIcon,
  GraduationCap,
  Menu,
  X,
} from 'lucide-react';

const NAV = [
  { to: '/dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
  { to: '/today', label: '今日のタスク', icon: CalendarCheck },
  { to: '/reading', label: 'Reading', icon: BookOpen },
  { to: '/listening', label: 'Listening', icon: Headphones },
  { to: '/speaking', label: 'Speaking', icon: Mic },
  { to: '/writing', label: 'Writing', icon: PenLine },
  { to: '/vocabulary', label: '単語', icon: BookMarked },
  { to: '/settings', label: '設定', icon: SettingsIcon },
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-0.5">
      {NAV.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          className={({ isActive }) =>
            [
              'flex items-center gap-3 rounded-token px-3 py-2.5 text-small transition-colors',
              isActive
                ? 'bg-accent-soft text-accent-ink font-medium'
                : 'text-ink-muted hover:bg-canvas hover:text-ink',
            ].join(' ')
          }
        >
          <Icon size={18} strokeWidth={1.9} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

function Brand({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const box = size === 'sm' ? 'w-7 h-7' : 'w-8 h-8';
  return (
    <div className="flex items-center gap-2">
      <span className={`grid place-items-center ${box} rounded-token bg-accent text-white`}>
        <GraduationCap size={size === 'sm' ? 16 : 18} strokeWidth={2} />
      </span>
      <div className="leading-tight">
        <div className="font-semibold">Ascend</div>
        {size === 'md' && <div className="text-micro text-ink-subtle">TOEFL 105+ Studio</div>}
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const current = NAV.find((n) => pathname.startsWith(n.to));

  // Close the drawer on route change and lock body scroll while it is open.
  useEffect(() => setDrawerOpen(false), [pathname]);
  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <div className="mx-auto max-w-content md:grid md:grid-cols-[240px_1fr]">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex flex-col border-r border-line min-h-screen sticky top-0 px-4 py-6">
          <div className="px-2 mb-8">
            <Brand />
          </div>
          <NavList />
        </aside>

        {/* Mobile slide-in drawer */}
        {drawerOpen && (
          <div className="md:hidden fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setDrawerOpen(false)}
              aria-hidden
            />
            <aside
              className="absolute left-0 top-0 bottom-0 w-72 max-w-[80vw] bg-surface border-r border-line p-4 flex flex-col gap-6 shadow-subtle"
              style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
              role="dialog"
              aria-label="メニュー"
            >
              <div className="flex items-center justify-between">
                <Brand />
                <button
                  className="grid place-items-center w-9 h-9 rounded-token text-ink-muted hover:bg-canvas"
                  aria-label="メニューを閉じる"
                  onClick={() => setDrawerOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>
              <NavList onNavigate={() => setDrawerOpen(false)} />
            </aside>
          </div>
        )}

        {/* Main column */}
        <div className="min-h-screen flex flex-col">
          {/* Mobile top app bar (single, unified) */}
          <header
            className="md:hidden sticky top-0 z-30 flex items-center gap-2 border-b border-line bg-canvas px-2 h-14"
            style={{ paddingTop: 'env(safe-area-inset-top)' }}
          >
            <button
              className="grid place-items-center w-10 h-10 rounded-token text-ink-muted hover:bg-surface"
              aria-label="メニューを開く"
              onClick={() => setDrawerOpen(true)}
            >
              <Menu size={20} />
            </button>
            <h1 className="text-h2 font-semibold truncate">{current?.label ?? 'Ascend'}</h1>
          </header>

          {/* Desktop page heading */}
          <header className="hidden md:block px-10 pt-8 pb-2">
            <h1 className="text-h1 font-semibold">{current?.label ?? 'Ascend'}</h1>
          </header>

          <main
            className="flex-1 px-4 md:px-10 py-5 md:py-6"
            style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
