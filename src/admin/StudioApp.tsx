import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { AdminLayout } from './AdminLayout'
import { AuthProvider } from './AuthProvider'
import { GalleryPage } from './pages/GalleryPage'
import { GuestsPage } from './pages/GuestsPage'
import { LoginPage } from './pages/LoginPage'
import { ProgrammePage } from './pages/ProgrammePage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { SitePage } from './pages/SitePage'
import { StudioPlaceholder } from './pages/StudioPlaceholder'
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
          <Route
            path="wishes"
            element={<StudioPlaceholder title="Guest book" step={14} mockup="admin-wishes.html" />}
          />
          <Route
            path="gifts"
            element={
              <StudioPlaceholder title="Gifts" step={14} mockup="admin-site.html (Cash gifts)" />
            }
          />
          <Route
            path="door"
            element={<StudioPlaceholder title="Door check-in" step={14} mockup="admin-door.html" />}
          />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
