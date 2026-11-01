import { NavLink, Route, Routes, useLocation } from 'react-router'
import { BookOpen, Layers, Settings } from 'lucide-react'
import { HomePage } from '@/pages/HomePage'
import { ReviewPage } from '@/pages/ReviewPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { formatLongDate, todayKey } from '@/lib/dates'
import { cn } from '@/lib/cn'

const tabs = [
  { to: '/', label: 'Words', icon: BookOpen },
  { to: '/review', label: 'Review', icon: Layers },
  { to: '/settings', label: 'Settings', icon: Settings },
] as const

export default function App() {
  const { search } = useLocation()

  return (
    <div className="mx-auto flex min-h-dvh max-w-4xl flex-col px-4 pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-6">
      <header className="mb-5 flex flex-col gap-1 pt-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div>
          <h1 className="font-display text-[28px] leading-tight font-bold tracking-tight text-ink sm:text-3xl">
            Mijn Woordenboek
          </h1>
          <p className="text-sm text-sage-600">A little Dutch every day</p>
        </div>
        <p className="text-xs text-muted sm:pb-0.5 sm:text-right">{formatLongDate(todayKey())}</p>
      </header>

      {/* Bottom padding leaves room for the floating add button and the tab bar. */}
      <main className="flex-1 pb-[calc(10rem+env(safe-area-inset-bottom))]">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-cream/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md"
      >
        <ul className="mx-auto flex max-w-md">
          {tabs.map(({ to, label, icon: Icon }) => (
            <li key={to} className="flex-1">
              <NavLink
                to={{ pathname: to, search }}
                end
                className={({ isActive }) =>
                  cn(
                    'flex h-16 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors',
                    isActive ? 'text-sage-700' : 'text-muted hover:text-ink',
                  )
                }
              >
                <Icon className="h-5 w-5" aria-hidden />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
