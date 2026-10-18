import { Outlet, useLocation } from 'react-router-dom'

import { AdminSidebar } from '@/admin/components/AdminSidebar'
import { AdminCatalogProvider } from '@/admin/context/AdminCatalogContext'

const PAGE_META: Record<string, { title: string; description: string }> = {
  '/admin': {
    title: 'Pulpit',
    description:
      'Podsumowanie katalogu z bazy: liczba miejsc, wydarzeń i tras oraz rozkład kategorii i gmin.',
  },
  '/admin/zapytania': {
    title: 'Zapytania',
    description:
      'Nadchodzące wydarzenia z katalogu i wnioski z danych — kontekst pod wyszukiwanie w języku naturalnym.',
  },
  '/admin/katalog': {
    title: 'Katalog',
    description:
      'Miejsca, wydarzenia i trasy pobrane z API. Przyciski edycji są nieaktywne w tej wersji.',
  },
}

function resolveMeta(pathname: string): { title: string; description: string } {
  return (
    PAGE_META[pathname] ?? {
      title: 'Azymut',
      description: 'Podgląd danych katalogu aplikacji.',
    }
  )
}

export function AdminLayout() {
  const { pathname } = useLocation()
  const { title, description } = resolveMeta(pathname)

  return (
    <AdminCatalogProvider>
      <div className="admin-shell flex min-h-svh min-h-dvh w-full">
        <AdminSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-border/80 bg-card px-6 py-4">
            <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          </header>
          <main className="admin-main-surface flex-1 overflow-y-auto px-6 py-6">
            <div className="mx-auto max-w-6xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </AdminCatalogProvider>
  )
}
