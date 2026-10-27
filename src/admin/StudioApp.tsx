import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { AdminLayout } from './AdminLayout'
import { AuthProvider } from './AuthProvider'
import { DoorPage } from './pages/DoorPage'
import { GalleryPage } from './pages/GalleryPage'
import { GuestsPage } from './pages/GuestsPage'
import { LoginPage } from './pages/LoginPage'
import { ProgrammePage } from './pages/ProgrammePage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { SitePage } from './pages/SitePage'
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
