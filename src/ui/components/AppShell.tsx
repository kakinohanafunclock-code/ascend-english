import { NavLink, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
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

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const current = NAV.find((n) => pathname.startsWith(n.to));
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <div className="mx-auto max-w-content grid grid-cols-1 md:grid-cols-[240px_1fr]">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col border-r border-line min-h-screen sticky top-0 px-4 py-6">
          <div className="flex items-center gap-2 px-2 mb-8">
            <span className="grid place-items-center w-8 h-8 rounded-token bg-accent text-white">
              <GraduationCap size={18} strokeWidth={2} />
            </span>
            <div className="leading-tight">
              <div className="font-semibold">Ascend</div>
              <div className="text-micro text-ink-subtle">TOEFL 105+ Studio</div>
            </div>
          </div>
          <nav className="flex flex-col gap-0.5">
            {NAV.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-2.5 rounded-token px-2.5 py-2 text-small transition-colors',
                    isActive
                      ? 'bg-accent-soft text-accent-ink font-medium'
                      : 'text-ink-muted hover:bg-surface hover:text-ink',
                  ].join(' ')
                }
              >
                <Icon size={17} strokeWidth={1.9} />
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <div className="min-h-screen">
          {/* Mobile top nav */}
          <div className="md:hidden flex items-center gap-3 border-b border-line px-4 py-3">
            <span className="grid place-items-center w-7 h-7 rounded-token bg-accent text-white">
              <GraduationCap size={16} />
            </span>
            <span className="font-semibold">Ascend</span>
          </div>
          <header className="px-6 md:px-10 pt-8 pb-2">
            <h1 className="text-h1 font-semibold">{current?.label ?? 'Ascend'}</h1>
          </header>
          <main className="px-6 md:px-10 py-6">{children}</main>
          {/* Mobile bottom nav */}
          <nav className="md:hidden sticky bottom-0 grid grid-cols-8 border-t border-line bg-surface">
            {NAV.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                aria-label={label}
                className={({ isActive }) =>
                  [
                    'grid place-items-center py-2.5',
                    isActive ? 'text-accent' : 'text-ink-subtle',
                  ].join(' ')
                }
              >
                <Icon size={18} strokeWidth={1.9} />
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
