import { useState } from 'react'
import { Button } from '../../components/Button'
import { SelectField } from '../../components/Form'
import { Icon } from '../../components/Icon'
import { IconButton } from '../../components/IconButton'
import { useToast } from '../../components/Toast'
import { copyText } from '../../lib/clipboard'
import { cx } from '../../lib/cx'
import { formatPhone } from '../../lib/phone'
import { formatShortDateTime } from '../../lib/time'
import { invitationUrl, inviteMessage, whatsappUrl } from '../../lib/whatsapp'
import { GuestDialog } from '../components/GuestDialog'
import { ImportPanel } from '../components/ImportPanel'
import { useGuests, useMarkSent, useRestoreGuest, useStats, type GuestRow } from '../guests'
import { studioErrorMessage, useSettings } from '../queries'
import studio from '../studio.module.css'
import styles from './GuestsPage.module.css'

type Filter = 'all' | 'unsent' | 'unopened' | 'attending' | 'declined' | 'pending' | 'removed'

const SIXTY_DAYS = 60 * 24 * 60 * 60 * 1000
const LANG_KEY = 'studio-default-lang'

const filters: Array<[Filter, string, (g: GuestRow) => boolean]> = [
  ['all', 'All', () => true],
  ['unsent', 'Not sent', (g) => !g.invite_sent_at],
  ['unopened', 'Not opened', (g) => !g.first_opened_at],
  ['attending', 'Attending', (g) => g.attending === true],
  ['declined', 'Declined', (g) => g.attending === false],
  ['pending', 'Awaiting reply', (g) => g.attending === null],
]

function readDefaultLang(): 'en' | 'fr' {
  try {
    return localStorage.getItem(LANG_KEY) === 'en' ? 'en' : 'fr'
  } catch {
    return 'fr'
  }
}

export function GuestsPage() {
  const toast = useToast()
  const guests = useGuests()
  const stats = useStats().data
  const settings = useSettings().data
  const markSent = useMarkSent()
  const restore = useRestoreGuest()

  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<GuestRow | 'new' | null>(null)
  const [defaultLang, setDefaultLang] = useState<'en' | 'fr'>(readDefaultLang)
  const origin = window.location.origin

  const all = guests.data ?? []
  // Removed guests are hidden for 60 days, then forgotten.
  const [now] = useState(() => Date.now())
  const active = all.filter((g) => !g.deleted_at)
  const removed = all.filter(
    (g) => g.deleted_at && now - new Date(g.deleted_at).getTime() < SIXTY_DAYS,
  )

  const base =
    filter === 'removed' ? removed : active.filter(filters.find(([k]) => k === filter)![2])
  const q = search.trim().toLowerCase()
  const digits = q.replace(/\D/g, '')
  const shown = q
    ? base.filter(
        (g) =>
          g.name?.toLowerCase().includes(q) || (digits.length >= 3 && g.phone?.includes(digits)),
      )
    : base

  function messageFor(g: GuestRow) {
    const lang = (g.lang as 'en' | 'fr' | null) ?? defaultLang
    const template = (lang === 'fr' ? settings?.wa_template_fr : settings?.wa_template_en) || ''
    return inviteMessage(template, {
      guestName: g.name ?? '',
      bride: settings?.bride ?? '',
      groom: settings?.groom ?? '',
      link: invitationUrl(origin, g.token ?? ''),
    })
  }

  function chooseDefaultLang(lang: 'en' | 'fr') {
    setDefaultLang(lang)
    try {
      localStorage.setItem(LANG_KEY, lang)
    } catch {
      // Remembered for this visit only.
    }
  }

  const percent = (n: number) => (stats && stats.invited ? (n / stats.invited) * 100 : 0)

  return (
    <>
      <div className={studio.pageHead}>
        <div>
          <h1 className="display">Overview &amp; guests</h1>
          <p>Upload the list, send private links on WhatsApp and follow replies.</p>
        </div>
        <Button onClick={() => setEditing('new')}>
          <Icon name="plus" /> Add guest
        </Button>
      </div>

      <section className={styles.stats} aria-label="Figures">
        <div className={cx(styles.stat, styles.accent)}>
          <strong>{stats?.invited ?? '–'}</strong>
          <span>Invited</span>
        </div>
        <div className={styles.stat}>
          <strong>{stats?.sent ?? '–'}</strong>
          <span>Invitations sent</span>
        </div>
        <div className={styles.stat}>
          <strong>{stats?.opened ?? '–'}</strong>
          <span>Opened</span>
        </div>
        <div className={styles.stat}>
          <strong>{stats?.attending ?? '–'}</strong>
          <span>Attending</span>
        </div>
        <div className={styles.stat}>
          <strong>{stats?.declined ?? '–'}</strong>
          <span>Declined</span>
        </div>
        <div className={styles.stat}>
          <strong>{stats?.pending ?? '–'}</strong>
          <span>Awaiting reply</span>
          <div className={styles.bar} aria-hidden="true">
            <i
              style={{ width: `${percent(stats?.attending ?? 0)}%`, background: 'var(--emerald)' }}
            />
            <i style={{ width: `${percent(stats?.declined ?? 0)}%`, background: 'var(--slate)' }} />
          </div>
        </div>
      </section>

      <ImportPanel guests={all} origin={origin} />

      <section className={studio.card} aria-labelledby="send-title" style={{ paddingBottom: 20 }}>
        <div className={styles.toolbar}>
          <div>
            <h2 id="send-title">Sending on WhatsApp</h2>
            <p className={studio.lede}>
              Each button opens WhatsApp with the guest’s personal message and link ready. You press
              Send. The text is edited in Site &amp; texts.
            </p>
          </div>
          <div className={styles.langPick}>
            <SelectField
              look="box"
              label="Language when the guest’s isn’t known"
              value={defaultLang}
              onChange={(v) => chooseDefaultLang(v as 'en' | 'fr')}
              options={[
                { value: 'fr', label: 'Français' },
                { value: 'en', label: 'English' },
              ]}
            />
          </div>
        </div>
      </section>

      <section aria-label="Guests" className={styles.list}>
        <div className={styles.toolbar}>
          <div className={styles.chips} role="group" aria-label="Filter guests">
            {filters.map(([key, label, test]) => (
              <button
                key={key}
                type="button"
                className={styles.chip}
                aria-pressed={filter === key}
                onClick={() => setFilter(key)}
              >
                {label} <b>{active.filter(test).length}</b>
              </button>
            ))}
            {removed.length > 0 && (
              <button
                type="button"
                className={styles.chip}
                aria-pressed={filter === 'removed'}
                onClick={() => setFilter('removed')}
              >
                Recently removed <b>{removed.length}</b>
              </button>
            )}
          </div>
          <input
            className={styles.search}
            type="search"
            placeholder="Search by name or phone"
            aria-label="Search guests"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {guests.isPending && <p className={studio.loading}>Loading guests…</p>}
        {guests.isError && <p className={studio.error}>{studioErrorMessage(guests.error)}</p>}

        {guests.isSuccess && (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Guest</th>
                  <th scope="col">Invitation sent</th>
                  <th scope="col">Opened</th>
                  <th scope="col">Reply</th>
                  <th scope="col">Checked in</th>
                  <th scope="col">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {shown.map((g) => (
                  <tr key={g.id}>
                    <td>
                      <span className={styles.name}>{g.name}</span>
                      <span className={styles.sub}>
                        {formatPhone(g.phone) || 'No phone'}
                        {g.lang && ` · ${g.lang.toUpperCase()}`}
                      </span>
                    </td>
                    <td>
                      {g.invite_sent_at ? (
                        formatShortDateTime(g.invite_sent_at)
                      ) : (
                        <span className={cx(styles.badge, styles.waiting)}>Not sent</span>
                      )}
                    </td>
                    <td>
                      {g.first_opened_at ? (
                        <>
                          {formatShortDateTime(g.last_opened_at)}
                          <span className={styles.sub}>{g.open_count}× in total</span>
                        </>
                      ) : (
                        <span className={styles.sub}>Not opened yet</span>
                      )}
                    </td>
                    <td>
                      {g.attending === true && (
                        <span className={cx(styles.badge, styles.yes)}>Attending</span>
                      )}
                      {g.attending === false && (
                        <span className={cx(styles.badge, styles.no)}>Declined</span>
                      )}
                      {g.attending === null && (
                        <span className={cx(styles.badge, styles.waiting)}>Awaiting</span>
                      )}
                      {g.diet && <span className={styles.sub}>Diet: {g.diet}</span>}
                    </td>
                    <td>
                      {g.last_checked_in_at ? (
                        formatShortDateTime(g.last_checked_in_at)
                      ) : (
                        <span className={styles.sub}>—</span>
                      )}
                    </td>
                    <td>
                      {filter === 'removed' ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          loading={restore.isPending && restore.variables === g.id}
                          onClick={() =>
                            restore.mutate(g.id!, {
                              onSuccess: () => toast(`${g.name} is back on the list`),
                              onError: (err) => toast(studioErrorMessage(err), 'error'),
                            })
                          }
                        >
                          Restore
                        </Button>
                      ) : (
                        <div className={styles.actions}>
                          <a
                            className={styles.whatsapp}
                            href={whatsappUrl(g.phone, messageFor(g))}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => markSent.mutate(g.id!)}
                            aria-label={`Send ${g.name}’s invitation on WhatsApp`}
                          >
                            <Icon name="whatsapp" /> WhatsApp
                          </a>
                          <IconButton
                            icon="copy"
                            size="sm"
                            label={`Copy ${g.name}’s private link`}
                            onClick={async () => {
                              await copyText(invitationUrl(origin, g.token ?? ''))
                              toast('Private link copied')
                            }}
                          />
                          <IconButton
                            icon="edit"
                            size="sm"
                            label={`Edit ${g.name}`}
                            onClick={() => setEditing(g)}
                          />
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {shown.length === 0 && (
                  <tr>
                    <td colSpan={6} className={styles.sub} style={{ padding: '28px 16px' }}>
                      {all.length === 0
                        ? 'No guests yet. Upload your list or add a guest.'
                        : 'No guests match.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {editing && (
        <GuestDialog
          guest={editing === 'new' ? null : editing}
          origin={origin}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  )
}
