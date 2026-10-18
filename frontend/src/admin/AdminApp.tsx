import { Navigate, Route, Routes } from 'react-router-dom'

import { AdminLayout } from '@/admin/components/AdminLayout'
import { AdminCatalogPage } from '@/admin/pages/AdminCatalogPage'
import { AdminDashboardPage } from '@/admin/pages/AdminDashboardPage'
import { AdminQueriesPage } from '@/admin/pages/AdminQueriesPage'

export function AdminApp() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="zapytania" element={<AdminQueriesPage />} />
        <Route path="katalog" element={<AdminCatalogPage />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
    </Routes>
  )
}
