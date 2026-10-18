import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { AdminApp } from '@/admin/AdminApp'
import App from '@/App'

export function RootApp() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="/" element={<App />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
