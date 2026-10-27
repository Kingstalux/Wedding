import { ButtonLink } from './components/Button'
import { Eyebrow, Monogram, Rule } from './components/Typography'

/** Temporary home page until the guest site is built in Step 3. */
export function ComingSoon() {
  return (
    <main
      className="center"
      style={{ minHeight: '100vh', display: 'grid', placeContent: 'center', padding: 24 }}
    >
      <Monogram bride="Bride" groom="Groom" size={40} gold />
      <Rule center />
      <Eyebrow>Under construction</Eyebrow>
      <h1 className="display h2">The wedding site is on its way</h1>
      {import.meta.env.DEV && (
        <p style={{ marginTop: 32 }}>
          <ButtonLink to="/dev/ui" variant="ghost" size="sm">
            Open the component gallery
          </ButtonLink>
        </p>
      )}
    </main>
  )
}
