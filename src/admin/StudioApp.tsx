import { useEffect, useLayoutEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { AdminLayout } from './AdminLayout'
import { AuthProvider } from './AuthProvider'
import { DoorPage } from './pages/DoorPage'
import { GalleryPage } from './pages/GalleryPage'
import { GiftsPage } from './pages/GiftsPage'
import { GuestsPage } from './pages/GuestsPage'
import { LoginPage } from './pages/LoginPage'
import { ProgrammePage } from './pages/ProgrammePage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { SitePage } from './pages/SitePage'
import { TablesPage } from './pages/TablesPage'
import { WishesPage } from './pages/WishesPage'
import { RequireAdmin } from './RequireAdmin'

/*
 * Everything under /admin. This file (and all it imports) is loaded only when
 * someone opens the studio, so guests never download the studio's code.
 */
export function StudioApp() {
  useEffect(() => {
    document.title = 'Couple’s studio'
  }, [])

  // The studio keeps square corners (see tokens.css); set before the first paint.
  useLayoutEffect(() => {
    document.documentElement.dataset.area = 'studio'
    return () => {
      delete document.documentElement.dataset.area
    }
  }, [])

  return (
    <AuthProvider>
      <Routes>
        <Route path="login" element={<LoginPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />

        <Route
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<GuestsPage />} />
          <Route path="site" element={<SitePage />} />
          <Route path="tables" element={<TablesPage />} />
          <Route path="gifts" element={<GiftsPage />} />
          <Route path="programme" element={<ProgrammePage />} />
          <Route path="gallery" element={<GalleryPage />} />
          <Route path="wishes" element={<WishesPage />} />
          <Route path="door" element={<DoorPage />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
