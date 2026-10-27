import { useLocation } from 'react-router'
import { ButtonLink } from '../components/Button'
import { Eyebrow, Rule } from '../components/Typography'

/** Stands in for every studio page until Steps 10–14 build them. */
export function AdminPlaceholder() {
  const { pathname } = useLocation()
  return (
    <main className="container" style={{ padding: '96px 24px' }}>
      <Eyebrow>Couple’s studio</Eyebrow>
      <h1 className="display h2">Coming in Steps 10–14</h1>
      <Rule />
      <p className="muted">
        <code>{pathname}</code> will be built once the database is connected. The design is in{' '}
        <code>mockup/admin-*.html</code>.
      </p>
      <p style={{ marginTop: 24 }}>
        <ButtonLink to="/i/demo" variant="ghost" size="sm">
          Open the test invitation
        </ButtonLink>
      </p>
    </main>
  )
}
