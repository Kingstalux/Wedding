import { useEffect, useState } from 'react'
import { Button, ButtonLink } from '../components/Button'
import { Choice, SelectField, Switch, TextAreaField, TextField } from '../components/Form'
import { Icon, type IconName } from '../components/Icon'
import { IconButton } from '../components/IconButton'
import { Photo } from '../components/Photo'
import { useToast } from '../components/Toast'
import { Eyebrow, Monogram, Rule } from '../components/Typography'
import { cx } from '../lib/cx'
import styles from './DevUi.module.css'

/*
 * Component gallery: every shared building block on one page, to compare
 * against the mockup (http://localhost:5500). Only exists in `npm run dev`.
 */

const colours = [
  ['--navy', 'Midnight navy'],
  ['--slate', 'Slate blue'],
  ['--forest', 'Forest green · ink'],
  ['--emerald', 'Emerald · primary'],
  ['--gold', 'Gold'],
  ['--ivory', 'Ivory'],
  ['--white', 'White'],
] as const

const icons: IconName[] = [
  'arrowDown',
  'arrowRight',
  'chevronLeft',
  'chevronRight',
  'close',
  'menu',
  'check',
  'plus',
  'copy',
  'edit',
  'trash',
  'music',
  'play',
  'external',
  'signOut',
  'users',
  'layout',
  'pin',
  'image',
  'message',
  'gift',
  'scan',
  'whatsapp',
]

export function DevUi() {
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [shown, setShown] = useState(true)
  const [attend, setAttend] = useState('')

  return (
    <main className={cx('container', styles.page)}>
      <Eyebrow>Development only</Eyebrow>
      <h1 className="display h2">Component gallery</h1>
      <Rule />
      <SupabaseStatus />

      <section className={styles.section}>
        <h2 className={styles.title}>Colours</h2>
        <div className={styles.row}>
          {colours.map(([token, name]) => (
            <span key={token} className={styles.swatch}>
              <i style={{ background: `var(${token})` }} />
              {name}
            </span>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.title}>Typography</h2>
        <Eyebrow>Eyebrow · together with their families</Eyebrow>
        <p className="display" style={{ fontSize: 72, textTransform: 'uppercase' }}>
          Bride <em style={{ textTransform: 'none', fontSize: '0.5em' }}>and</em> Groom
        </p>
        <p className="display h2">The Celebration</p>
        <p className="display h3">Let us know (optional)</p>
        <Rule />
        <p className="serif-body" style={{ maxWidth: 560 }}>
          Thank you for being part of our story. Every step has been carried by God’s grace, and we
          want you beside us as we say yes before the law, our families, and the Lord.
        </p>
        <p className="script">Bride + Groom</p>
        <p className="muted">Muted body text in Jost, used for hints and secondary information.</p>
        <div className={styles.row} style={{ marginTop: 20 }}>
          <Monogram bride="Bride" groom="Groom" />
          <Monogram bride="Bride" groom="Groom" size={40} gold />
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.title}>Buttons</h2>
        <div className={styles.row}>
          <Button>Submit response</Button>
          <Button variant="ghost">Change my answer</Button>
          <Button variant="gold">Open your invitation</Button>
          <Button variant="danger" size="sm">
            <Icon name="trash" /> Delete
          </Button>
          <Button size="sm">Small</Button>
          <Button disabled>Disabled</Button>
          <Button
            loading={loading}
            onClick={() => {
              setLoading(true)
              setTimeout(() => setLoading(false), 1500)
            }}
          >
            {loading ? 'Saving…' : 'Click to load'}
          </Button>
          <ButtonLink
            href="https://www.google.com/maps"
            target="_blank"
            rel="noopener"
            variant="ghost"
            size="sm"
          >
            <Icon name="pin" /> Directions
          </ButtonLink>
        </div>
        <div className={cx(styles.dark, styles.row)} style={{ marginTop: 20 }}>
          <Button variant="gold">Gold on emerald</Button>
          <Button variant="ghostLight">Ghost light</Button>
          <IconButton icon="music" label="Pause music" tone="light" />
          <IconButton icon="menu" label="Open menu" tone="light" />
          <Eyebrow light className="">
            Light eyebrow
          </Eyebrow>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.title}>Icons</h2>
        <div className={styles.row} style={{ marginBottom: 16 }}>
          <IconButton icon="edit" label="Edit" />
          <IconButton icon="copy" label="Copy link" size="sm" />
          <IconButton icon="trash" label="Delete" size="sm" disabled />
        </div>
        <div className={styles.icons}>
          {icons.map((name) => (
            <div key={name}>
              <Icon name={name} size={20} />
              {name}
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.title}>Form fields: guest look (“line”)</h2>
        <div className={styles.grid}>
          <TextField label="Dietary notes (optional)" placeholder="Vegetarian, allergies…" />
          <TextField
            label="With an error"
            defaultValue="https://spam.example"
            error="Links are not allowed in messages."
          />
          <SelectField label="Sent via" defaultValue="momo">
            <option value="momo">MTN Mobile Money</option>
            <option value="orange">Orange Money</option>
            <option value="cash">Cash at the reception</option>
          </SelectField>
          <TextAreaField label="A note for the couple (optional)" rows={3} />
        </div>
        <fieldset
          className={styles.row}
          style={{ border: 0, padding: 0, margin: '24px 0 0', gap: '8px 32px' }}
        >
          <legend className="sr-only">Will you attend?</legend>
          <Choice
            name="attend"
            value="yes"
            label="Joyfully accepts"
            checked={attend === 'yes'}
            onChange={() => setAttend('yes')}
          />
          <Choice
            name="attend"
            value="no"
            label="Regretfully declines"
            checked={attend === 'no'}
            onChange={() => setAttend('no')}
          />
        </fieldset>
      </section>

      <section className={styles.section}>
        <h2 className={styles.title}>Form fields: studio look (“box”)</h2>
        <div className={styles.grid}>
          <TextField look="box" label="Bride’s name" defaultValue="Bride" />
          <TextField
            look="box"
            label="MTN MoMo number"
            inputMode="tel"
            placeholder="+237 6XX XX XX XX"
            hint="Leave empty to hide this option."
          />
          <TextField
            look="box"
            label="Countdown to"
            type="datetime-local"
            defaultValue="2026-12-23T11:00"
          />
          <TextAreaField
            look="box"
            label="A word (English)"
            defaultValue="Dear {guest name}, thank you for being part of our story."
          />
        </div>
        <div style={{ marginTop: 16 }}>
          <Switch
            label={shown ? 'Shown on the site' : 'Hidden from the site'}
            checked={shown}
            onChange={(e) => setShown(e.target.checked)}
          />
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.title}>Photos and placeholders</h2>
        <div
          className={styles.icons}
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}
        >
          {(['navy', 'slate', 'forest', 'emerald'] as const).map((tone) => (
            <Photo key={tone} tone={tone} label={tone} style={{ aspectRatio: '4 / 5' }} />
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.title}>Toasts</h2>
        <div className={styles.row}>
          <Button variant="ghost" size="sm" onClick={() => toast('Saved — the site is updated')}>
            Success toast
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toast('Could not save. Please try again.', 'error')}
          >
            Error toast
          </Button>
        </div>
      </section>
    </main>
  )
}

/** Checks that .env.local points at a reachable Supabase project. */
function SupabaseStatus() {
  const [state, setState] = useState<'checking' | 'ok' | 'fail'>('checking')
  const url = import.meta.env.VITE_SUPABASE_URL

  useEffect(() => {
    fetch(`${url}/auth/v1/health`, { headers: { apikey: import.meta.env.VITE_SUPABASE_ANON_KEY } })
      .then((res) => setState(res.ok ? 'ok' : 'fail'))
      .catch(() => setState('fail'))
  }, [url])

  const ref = url?.replace(/^https:\/\/([^.]+).*$/, '$1')
  const text = {
    checking: 'Checking Supabase connection…',
    ok: `Connected to Supabase project ${ref}`,
    fail: 'Could not reach Supabase. Check .env.local and restart npm run dev.',
  }[state]

  return (
    <p className={styles.status} role="status">
      <span
        className={cx(styles.dot, state === 'ok' && styles.ok, state === 'fail' && styles.fail)}
      />
      {text}
    </p>
  )
}
