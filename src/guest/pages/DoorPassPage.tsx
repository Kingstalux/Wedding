import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { checkIn, pickCurrentEvent, type CheckInResult } from '../../admin/door'
import { Button } from '../../components/Button'
import { Icon } from '../../components/Icon'
import { Select } from '../../components/Select'
import { Eyebrow } from '../../components/Typography'
import { useT } from '../../i18n/LanguageProvider'
import { cx } from '../../lib/cx'
import { supabase } from '../../lib/supabase'
import { formatDayShort, formatTime } from '../../lib/time'
import { errorMessageKey, readPass } from '../api'
import styles from './PassPage.module.css'

/*
 * Route: /pass/:code. What opens when someone scans a pass's QR code with a
 * phone camera. Anyone sees only the guest's first name and status
 * (read_pass). When the couple's studio account is signed in on this phone,
 * a "Check in" button appears too.
 */
export function DoorPassPage() {
  const { t } = useT()
  const { code = '' } = useParams()
  const pass = useQuery({ queryKey: ['pass', code], queryFn: () => readPass(code) })

  return (
    <div className={styles.page}>
      <main className={styles.door} aria-live="polite">
        <h1 className="sr-only">{t('door.eyebrow')}</h1>
        <Eyebrow>{t('door.eyebrow')}</Eyebrow>

        {pass.isPending && <p className="muted">{t('door.checking')}</p>}

        {pass.isError && (
          <p className="serif-body" role="alert">
            {t(errorMessageKey(pass.error))}
          </p>
        )}

        {pass.isSuccess && !pass.data && (
          <>
            <span className={cx(styles.status, styles.unknown)}>{t('door.notFound')}</span>
            <p className="muted" style={{ marginTop: 16 }}>
              {code}
            </p>
          </>
        )}

        {pass.data && (
          <>
            <span
              className={cx(styles.status, pass.data.attending === false ? styles.no : styles.ok)}
            >
              {pass.data.attending !== false && <Icon name="check" />}
              {pass.data.attending === false
                ? t('door.notAttending')
                : pass.data.attending
                  ? t('door.confirmed')
                  : t('door.noReply')}
            </span>
            <p className={styles.doorName}>{pass.data.first_name}</p>
            <p className="muted">
              {code.toUpperCase()} · {t('pass.seat')}
              {pass.data.checked_in && ` · ${t('door.checkedIn')}`}
            </p>
            <CoupleCheckIn code={code} />
          </>
        )}
      </main>
    </div>
  )
}

/** Shown only when the couple's studio account is signed in on this device. */
function CoupleCheckIn({ code }: { code: string }) {
  const queryClient = useQueryClient()
  const [eventId, setEventId] = useState('')
  const [result, setResult] = useState<CheckInResult | null>(null)
  const [busy, setBusy] = useState(false)

  const couple = useQuery({
    queryKey: ['door-couple'],
    staleTime: Infinity,
    queryFn: async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) return null
      const admin = await supabase.rpc('is_admin')
      if (admin.data !== true) return null
      const events = await supabase
        .from('events')
        .select('id, title_en, starts_at, ends_at')
        .order('starts_at')
      return events.data ?? []
    },
  })

  if (!couple.data) return null
  const events = couple.data
  const current = eventId || pickCurrentEvent(events)?.id || ''

  async function go() {
    setBusy(true)
    try {
      setResult(await checkIn(code, current))
      queryClient.invalidateQueries({ queryKey: ['pass', code] })
    } finally {
      setBusy(false)
    }
  }

  const message = {
    ok: 'Checked in ✓',
    already: 'Was already checked in for this event',
    declined: 'Replied “no”, not checked in',
    not_found: 'Not on the guest list',
  }

  return (
    <div className={styles.couple}>
      <p className={styles.coupleLabel}>Couple’s studio</p>
      <Select
        aria-label="Event"
        value={current}
        onChange={setEventId}
        className={styles.eventSelect}
        options={events.map((e) => ({
          value: e.id,
          label: `${e.title_en} · ${formatDayShort(e.starts_at, 'en')} ${formatTime(e.starts_at, 'en')}`,
        }))}
      />
      <Button block onClick={go} loading={busy} disabled={!current}>
        Check in
      </Button>
      {result && (
        <p className={styles.coupleResult} role="status">
          {message[result.status]}
        </p>
      )}
      <p className={styles.coupleLink}>
        <Link to="/admin/door">Open the door scanner</Link>
      </p>
    </div>
  )
}
