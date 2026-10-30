import { createBrowserRouter, Outlet, type RouteObject } from 'react-router'
import { ErrorPage } from './app/ErrorPage'
import { OfflineBanner } from './app/OfflineBanner'
import { HomeRedirect } from './guest/pages/HomeRedirect'
import { InvitationLayout, InvitationPage } from './guest/pages/InvitationPage'
import { PassPage } from './guest/pages/PassPage'
import { PersonalPage } from './guest/pages/PersonalPage'

/*
 * Every page of the app.
 *
 *   /i/:token          a guest's invitation (opening screen, then the page)
 *   /i/:token/pass     their entrance pass
 *   /pass/:code        what the door team sees when scanning a pass
 *   /admin/...         the couple's studio (loaded on demand, see admin/StudioApp)
 *   /                  back to this device's invitation, else "personal" page
 *   anything else      "This invitation is personal"
 */
const routes: RouteObject[] = [
  {
    path: '/i/:token',
    element: <InvitationLayout />,
    children: [
      { index: true, element: <InvitationPage /> },
      { path: 'pass', element: <PassPage /> },
    ],
  },
  { path: '/', element: <HomeRedirect /> },
  {
    path: '/pass/:code',
    // Only the door team opens this, so guests never download it.
    lazy: async () => ({ Component: (await import('./guest/pages/DoorPassPage')).DoorPassPage }),
  },
  {
    path: '/admin/*',
    // Load the studio's code only when someone opens it.
    lazy: async () => ({ Component: (await import('./admin/StudioApp')).StudioApp }),
  },
  { path: '*', element: <PersonalPage /> },
]

// The component gallery exists only while developing (`npm run dev`).
// In a production build import.meta.env.DEV is false, so Vite drops it.
if (import.meta.env.DEV) {
  routes.unshift({
    path: '/dev/ui',
    lazy: async () => ({ Component: (await import('./dev/DevUi')).DevUi }),
  })
}

// One parent around every page: a crash anywhere shows ErrorPage instead of a
// blank screen, and the offline bar appears on every page.
export const router = createBrowserRouter([
  {
    element: (
      <>
        <Outlet />
        <OfflineBanner />
      </>
    ),
    errorElement: <ErrorPage />,
    children: routes,
  },
])
