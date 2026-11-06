import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '../../components/Button'
import { SelectField } from '../../components/Form'
import { Icon } from '../../components/Icon'
import { cx } from '../../lib/cx'
import { fullNames } from '../../lib/guestNames'
import { formatPhone } from '../../lib/phone'
import { supabase } from '../../lib/supabase'
import { formatDayShort, formatShortDateTime, formatTime } from '../../lib/time'
import { checkIn, codeFromScan, pickCurrentEvent, type CheckInResult } from '../door'
import { useGuests } from '../guests'
import { seatsLabel, useReservations } from '../tables'
import { studioErrorMessage, useEvents } from '../queries'
import studio from '../studio.module.css'
import styles from './DoorPage.module.css'

type Scanner = { stop: () => Promise<void>; clear: () => void }
type Shown = CheckInResult & { code: string; at: string }

const MESSAGES: Record<CheckInResult['status'], string> = {
  ok: 'Checked in',
  already: 'Already checked in',
  declined: 'Replied “no” — not checked in',
  not_found: 'Not on the guest list',
}

export function DoorPage() {
  const queryClient = useQueryClient()
  const events = useEvents()
  const guests = useGuests()
  const reservations = useReservations()
  const [eventId, setEventId] = useState('')
  const [result, setResult] = useState<Shown | null>(null)
  const [log, setLog] = useState<Shown[]>([])
  const [error, setError] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [search, setSearch] = useState('')
  const scannerRef = useRef<Scanner | null>(null)
  const lastScan = useRef({ code: '', at: 0 })

  // Default to the event happening now (or next).
  const current = eventId || pickCurrentEvent(events.data ?? [])?.id || ''

  const counts = useQuery({
    queryKey: ['admin', 'checkins', current],
    enabled: Boolean(current),
    queryFn: async () => {
      // People, not passes: a couple's pass counts as two.
      const { data, error } = await supabase
        .from('checkins')
        .select('guest_id, guests(partner_name)')
        .eq('event_id', current)
      if (error) throw error
      return data.reduce((sum, c) => sum + (c.guests?.partner_name ? 2 : 1), 0)
    },
  })

  const run = useCallback(
    async (code: string) => {
      if (!current) return
      setError(null)
      try {
        const res = await checkIn(code, current)
        const shown = { ...res, code, at: new Date().toISOString() }
        setResult(shown)
        setLog((list) => [shown, ...list].slice(0, 30))
        navigator.vibrate?.(res.status === 'ok' ? 80 : [60, 60, 60])
        queryClient.invalidateQueries({ queryKey: ['admin', 'checkins', current] })
        queryClient.invalidateQueries({ queryKey: ['admin', 'guests'] })
      } catch (err) {
        setError(studioErrorMessage(err))
      }
    },
    [current, queryClient],
  )

  // Ignore the same code read again within 4 seconds (the camera sees it many times a second).
  const onScan = useCallback(
    (text: string) => {
      const code = codeFromScan(text)
      if (!code) return
      const now = Date.now()
      if (code === lastScan.current.code && now - lastScan.current.at < 4000) return
      lastScan.current = { code, at: now }
      run(code)
    },
    [run],
  )

  async function startCamera() {
    setError(null)
    try {
      const { Html5Qrcode } = await import('html5-qrcode') // loaded only when needed
      const scanner = new Html5Qrcode('door-reader', { verbose: false })
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        onScan,
        () => {},
      )
      scannerRef.current = scanner
      setScanning(true)
    } catch (err) {
      setError(
        /permission|notallowed/i.test(String(err))
          ? 'The camera was blocked. Allow camera access for this site in the browser settings.'
          : `The camera couldn’t start: ${String(err)}`,
      )
    }
  }

  async function stopCamera() {
    await scannerRef.current?.stop().catch(() => {})
    scannerRef.current?.clear()
    scannerRef.current = null
    setScanning(false)
  }

  // Turn the camera off when leaving the page.
  useEffect(() => () => void scannerRef.current?.stop().catch(() => {}), [])

  const q = search.trim().toLowerCase()
  const matches =
    q.length >= 2
      ? (guests.data ?? [])
          .filter((g) => !g.deleted_at)
          .filter(
            (g) =>
              g.name?.toLowerCase().includes(q) ||
              g.partner_name?.toLowerCase().includes(q) ||
              (g.phone ?? '').includes(q.replace(/\D/g, '') || '#') ||
              (g.partner_phone ?? '').includes(q.replace(/\D/g, '') || '#'),
          )
          .slice(0, 8)
      : []
  // Reserved seats (people without an invitation) can be found by their label.
  const reservedMatches =
    q.length >= 2
      ? (reservations.data ?? []).filter((r) => r.label.toLowerCase().includes(q)).slice(0, 4)
      : []

  return (
    <>
      <div className={studio.pageHead}>
        <div>
          <h1 className="display">Door check-in</h1>
          <p>Open this page on a phone at the entrance and scan each guest’s pass.</p>
        </div>
        <div className={styles.eventPick}>
          <SelectField
            look="box"
            label="Checking in for"
            value={current}
            onChange={setEventId}
            options={(events.data ?? []).map((e) => ({
              value: e.id,
              label: `${e.title_en} · ${formatDayShort(e.starts_at, 'en')} ${formatTime(e.starts_at, 'en')}`,
            }))}
          />
        </div>
      </div>

      <p className="muted">
        <strong style={{ color: 'var(--ink)', fontWeight: 500 }}>{counts.data ?? '–'}</strong>{' '}
        people checked in for this event.
      </p>

      <div className={styles.layout}>
        <div className={styles.column}>
          <div className={styles.scanner}>
            <div id="door-reader" className={styles.reader} />
            {!scanning && (
              <div className={styles.idle}>
                <Icon name="scan" size={40} />
                <p>Point the camera at a guest’s QR pass.</p>
                <Button variant="gold" onClick={startCamera} disabled={!current}>
                  Start camera
                </Button>
              </div>
            )}
          </div>
          {scanning && (
            <Button variant="ghost" onClick={stopCamera}>
              Stop camera
            </Button>
          )}

          <div className={styles.column}>
            <label className="sr-only" htmlFor="door-search">
              Find a guest by name or phone
            </label>
            <input
              id="door-search"
              type="search"
              placeholder="No pass? Search by name or phone"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.search}
            />
            {(matches.length > 0 || reservedMatches.length > 0) && (
              <ul className={styles.matches}>
                {reservedMatches.map((r) => (
                  <li key={r.id}>
                    <span>
                      {r.label}{' '}
                      <span className="muted">
                        Reserved · {seatsLabel(r.seats)} · Table {r.table_no}
                      </span>
                    </span>
                  </li>
                ))}
                {matches.map((g) => (
                  <li key={g.id}>
                    <span>
                      {fullNames(g.name ?? '', g.partner_name)}{' '}
                      <span className="muted">
                        {formatPhone(g.phone)}
                        {g.table_no && ` · Table ${g.table_no}`}
                      </span>
                    </span>
                    <Button size="sm" onClick={() => g.pass_code && run(g.pass_code)}>
                      Check in
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className={styles.column}>
          {error && (
            <p className={studio.error} role="alert">
              {error}
            </p>
          )}

          <div aria-live="assertive">
            {result ? (
              <section className={cx(styles.result, styles[result.status])}>
                <span className={styles.label}>{MESSAGES[result.status]}</span>
                <strong>{result.name ?? result.code}</strong>
                {(result.table_no || (result.seats ?? 1) > 1) && result.status !== 'declined' && (
                  <p className={styles.table}>
                    {result.table_no ? `Table ${result.table_no}` : 'No table yet'}
                    {(result.seats ?? 1) > 1 && ` · ${seatsLabel(result.seats ?? 1)}`}
                  </p>
                )}
                <p>
                  {result.code}
                  {result.status === 'already' &&
                    ` · first at ${formatShortDateTime(result.checked_in_at)}`}
                  {result.status === 'ok' &&
                    result.replied === false &&
                    ' · hadn’t replied to the invitation'}
                </p>
              </section>
            ) : (
              <section className={studio.card}>
                <p className="muted">The result of each scan appears here, in large colours.</p>
              </section>
            )}
          </div>

          {log.length > 0 && (
            <section className={studio.card}>
              <h2>Recent</h2>
              <ul className={styles.log}>
                {log.map((entry) => (
                  <li key={entry.at + entry.code}>
                    <span>{entry.name ?? entry.code}</span>
                    <span className="muted">
                      {MESSAGES[entry.status]} · {formatShortDateTime(entry.at).split(', ')[1]}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </>
  )
}
