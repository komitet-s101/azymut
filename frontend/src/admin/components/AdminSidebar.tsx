import { BarChart3, ClipboardList, LayoutDashboard, MapPinned } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { cn } from '@/lib/utils'

const NAV = [
  { to: '/admin', label: 'Pulpit', icon: LayoutDashboard, end: true },
  { to: '/admin/zapytania', label: 'Zapytania', icon: ClipboardList, end: false },
  { to: '/admin/katalog', label: 'Katalog', icon: MapPinned, end: false },
] as const

export function AdminSidebar() {
  return (
    <aside
      className="flex w-60 shrink-0 flex-col border-r border-border/80 bg-card"
      aria-label="Nawigacja panelu"
    >
      <div className="border-b border-border/80 px-4 py-5">
        <NavLink to="/admin" className="flex flex-col items-start">
          <img
            src="/brand/logo.png"
            alt="Azymut"
            className="h-10 w-auto max-w-[160px] object-contain"
            width={160}
            height={44}
          />
        </NavLink>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-secondary text-primary'
                  : 'text-foreground/80 hover:bg-muted hover:text-foreground',
              )
            }
          >
            <Icon className="size-4 shrink-0" strokeWidth={2} aria-hidden />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-border/80 p-4">
        <a
          href="/"
          className="flex items-center gap-2 text-xs font-medium text-primary hover:underline"
        >
          <BarChart3 className="size-3.5" aria-hidden />
          Aplikacja mobilna
        </a>
      </div>
    </aside>
  )
}
