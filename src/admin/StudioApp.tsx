import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { AdminLayout } from './AdminLayout'
import { AuthProvider } from './AuthProvider'
import { LoginPage } from './pages/LoginPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
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
          <Route
            index
            element={
              <StudioPlaceholder title="Overview & guests" step={13} mockup="admin-guests.html" />
            }
          />
          <Route
            path="site"
            element={<StudioPlaceholder title="Site & texts" step={11} mockup="admin-site.html" />}
          />
          <Route
            path="programme"
            element={
              <StudioPlaceholder title="Programme & maps" step={12} mockup="admin-programme.html" />
            }
          />
          <Route
            path="gallery"
            element={<StudioPlaceholder title="Gallery" step={12} mockup="admin-gallery.html" />}
          />
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
