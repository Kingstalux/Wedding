import { createBrowserRouter, type RouteObject } from 'react-router'
import { AdminPlaceholder } from './admin/AdminPlaceholder'
import { DoorPassPage } from './guest/pages/DoorPassPage'
import { InvitationLayout, InvitationPage } from './guest/pages/InvitationPage'
import { PassPage } from './guest/pages/PassPage'
import { PersonalPage } from './guest/pages/PersonalPage'

/*
 * Every page of the app.
 *
 *   /i/:token          a guest's invitation (opening screen, then the page)
 *   /i/:token/pass     their entrance pass
 *   /pass/:code        what the door team sees when scanning a pass
 *   /admin/...         the couple's studio (built in Steps 10–14)
 *   / and anything else → "This invitation is personal"
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
  { path: '/pass/:code', element: <DoorPassPage /> },
  { path: '/admin/*', element: <AdminPlaceholder /> },
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

export const router = createBrowserRouter(routes)
