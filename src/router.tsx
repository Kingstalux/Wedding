import { createBrowserRouter, type RouteObject } from 'react-router'
import { ComingSoon } from './ComingSoon'

/*
 * Every page of the app is listed here. Step 3 adds the guest site and the
 * studio routes; for now there's a placeholder home and the dev-only UI page.
 */
const routes: RouteObject[] = [{ path: '*', element: <ComingSoon /> }]

// The component gallery exists only while developing (`npm run dev`).
// In a production build import.meta.env.DEV is false, so Vite drops it.
if (import.meta.env.DEV) {
  routes.unshift({
    path: '/dev/ui',
    lazy: async () => ({ Component: (await import('./dev/DevUi')).DevUi }),
  })
}

export const router = createBrowserRouter(routes)
