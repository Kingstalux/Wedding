import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router'
import { OfflineBanner } from './OfflineBanner'

/**
 * The parent of every page. It marks whether we're on the guest site or in
 * the studio (<html data-area>), so the guest site can be navy edge to edge,
 * including the space shown when a phone over-scrolls, while the studio
 * keeps its ivory background.
 */
export function RootLayout() {
  const { pathname } = useLocation()
  const area = pathname.startsWith('/admin') ? 'studio' : 'guest'

  useEffect(() => {
    document.documentElement.dataset.area = area
  }, [area])

  return (
    <>
      <Outlet />
      <OfflineBanner />
    </>
  )
}
