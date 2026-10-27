import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { Button } from '../components/Button'
import { Rule } from '../components/Typography'
import { useAuth } from './AuthProvider'

/**
 * Guards every studio page:
 *  - not signed in      → the login page (and back here afterwards)
 *  - signed in, but not one of the couple's accounts → a polite refusal
 *  - the couple         → the page
 */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { auth, signOut } = useAuth()
  const location = useLocation()

  if (auth.status === 'loading') {
    return (
      <p role="status" className="muted center" style={{ padding: 96 }}>
        Loading the studio…
      </p>
    )
  }

  if (auth.status === 'signedOut') {
    const next = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/admin/login?next=${next}`} replace />
  }

  if (auth.status === 'notAdmin') {
    return (
      <main
        className="center"
        style={{ minHeight: '100dvh', display: 'grid', placeContent: 'center', padding: 24 }}
      >
        <h1 className="display h2">This account can’t open the studio</h1>
        <Rule center />
        <p className="muted" style={{ maxWidth: 460, margin: '0 auto 28px' }}>
          You’re signed in as <strong>{auth.email}</strong>, which isn’t one of the couple’s
          accounts. Sign out and use the studio account instead.
        </p>
        <div>
          <Button onClick={signOut}>Sign out</Button>
        </div>
      </main>
    )
  }

  return children
}
