import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Button, ButtonLink } from '../../components/Button'
import { Switch, TextField } from '../../components/Form'
import { Icon } from '../../components/Icon'
import { IconButton } from '../../components/IconButton'
import { useToast } from '../../components/Toast'
import { cx } from '../../lib/cx'
import type { Database } from '../../lib/database.types'
import { supabase } from '../../lib/supabase'
import { dayKey, formatDayLong, joinLocal, splitLocal } from '../../lib/time'
import { SaveBar } from '../components/SaveBar'
import { eventsKey, studioErrorMessage, useEvents } from '../queries'
import studio from '../studio.module.css'
import styles from './ProgrammePage.module.css'

type EventRow = Database['public']['Tables']['events']['Row']

type Draft = {
  title_en: string
  title_fr: string
  date: string
  start: string
  end: string
  venue: string
  maps_url: string
  visible: boolean
}

function toDraft(e: EventRow): Draft {
  const start = splitLocal(e.starts_at)
  return {
    title_en: e.title_en,
    title_fr: e.title_fr,
    date: start.date,
    start: start.time,
    end: splitLocal(e.ends_at).time,
    venue: e.venue,
    maps_url: e.maps_url ?? '',
    visible: e.visible,
  }
}

/** Returns a problem to show, or null when the moment can be saved. */
function check(d: Draft): string | null {
  if (!d.title_en.trim()) return 'Give this moment an English title.'
  if (!d.date || !d.start) return 'Set the date and start time.'
  if (d.end && d.end <= d.start) return 'The end time must be after the start time.'
  if (d.maps_url && !/^https:\/\//i.test(d.maps_url.trim()))
    return 'The Google Maps link must start with https://'
  return null
}

const mapsSearch = (venue: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${venue}, Yaoundé`)}`

export function ProgrammePage() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const events = useEvents()

  // Edits per moment, keyed by id. A moment with no entry here is unchanged.
  const [drafts, setDrafts] = useState<Record<string, Draft>>({})
  const [problems, setProblems] = useState<Record<string, string>>({})
  const changedIds = Object.keys(drafts).filter((id) => {
    const original = events.data?.find((e) => e.id === id)
    return original && JSON.stringify(drafts[id]) !== JSON.stringify(toDraft(original))
  })

  const save = useMutation({
    mutationFn: async () => {
      const found: Record<string, string> = {}
      for (const id of changedIds) {
        const problem = check(drafts[id])
        if (problem) found[id] = problem
      }
      setProblems(found)
      if (Object.keys(found).length) throw new Error('Some moments need a fix before saving.')

      for (const id of changedIds) {
        const d = drafts[id]
        const { error } = await supabase
          .from('events')
          .update({
            title_en: d.title_en.trim(),
            title_fr: d.title_fr.trim(),
            starts_at: joinLocal(d.date, d.start)!,
            ends_at: d.end ? joinLocal(d.date, d.end) : null,
            venue: d.venue.trim(),
            maps_url: d.maps_url.trim() || null,
            visible: d.visible,
          })
          .eq('id', id)
        if (error) throw error
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: eventsKey })
      setDrafts({})
      toast('Programme saved — the site is updated')
    },
  })

  const add = useMutation({
    mutationFn: async () => {
      const last = events.data?.at(-1)
      const { error } = await supabase.from('events').insert({
        title_en: 'New moment',
        title_fr: 'Nouveau moment',
        starts_at: last?.starts_at ?? joinLocal('2026-12-26', '12:00')!,
        sort: (last?.sort ?? 0) + 1,
      })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: eventsKey }),
    onError: (err) => toast(studioErrorMessage(err), 'error'),
  })

  const remove = useMutation({
    mutationFn: async (event: EventRow) => {
      const { error } = await supabase.from('events').delete().eq('id', event.id)
      if (error) throw error
    },
    onSuccess: (_data, event) => {
      setDrafts(({ [event.id]: _removed, ...rest }) => rest)
      queryClient.invalidateQueries({ queryKey: eventsKey })
      toast(`“${event.title_en}” was deleted`)
    },
    onError: (err) => toast(studioErrorMessage(err), 'error'),
  })

  if (events.isPending) return <p className={studio.loading}>Loading…</p>
  if (events.isError) return <p className={studio.error}>{studioErrorMessage(events.error)}</p>

  const edit = (event: EventRow, change: Partial<Draft>) =>
    setDrafts((all) => ({
      ...all,
      [event.id]: { ...(all[event.id] ?? toDraft(event)), ...change },
    }))

  // Each moment with its current values, and whether it starts a new day.
  const rows = events.data.map((event, i) => {
    const d = drafts[event.id] ?? toDraft(event)
    const day = d.date ? dayKey(`${d.date}T12:00:00+01:00`) : ''
    return { event, d, day, i }
  })

  return (
    <>
      <div className={studio.pageHead}>
        <div>
          <h1 className="display">Programme &amp; maps</h1>
          <p>
            Each moment shows on the schedule with a “Directions” button that opens Google Maps.
          </p>
        </div>
        <Button onClick={() => add.mutate()} loading={add.isPending}>
          <Icon name="plus" /> Add moment
        </Button>
      </div>

      <p className={styles.help}>
        <strong>Getting a Google Maps link:</strong> open Google Maps, find the venue, tap{' '}
        <em>Share</em> → <em>Copy link</em>, and paste it below. Use <em>Test</em> to check it opens
        the right place. Until then, the “Directions” button searches for the venue name.
      </p>

      {rows.map(({ event, d, day, i }) => {
        const showDay = i === 0 || day !== rows[i - 1].day
        const changed = changedIds.includes(event.id)

        return (
          <div key={event.id} style={{ display: 'contents' }}>
            {showDay && day && (
              <p className={styles.day}>{formatDayLong(`${day}T12:00:00+01:00`, 'en')}</p>
            )}
            <section
              className={cx(studio.card, changed && styles.changed)}
              aria-label={d.title_en || 'Moment'}
            >
              <div className={styles.head}>
                <span className={styles.num} aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h2>{d.title_en || 'Untitled moment'}</h2>
                <Switch
                  label={d.visible ? 'Shown' : 'Hidden'}
                  checked={d.visible}
                  onChange={(e) => edit(event, { visible: e.target.checked })}
                />
                <IconButton
                  icon="trash"
                  size="sm"
                  label={`Delete ${d.title_en}`}
                  onClick={() => window.confirm(`Delete “${d.title_en}”?`) && remove.mutate(event)}
                />
              </div>

              <div className={studio.grid3}>
                <TextField
                  look="box"
                  label="Title (English)"
                  value={d.title_en}
                  onChange={(e) => edit(event, { title_en: e.target.value })}
                />
                <TextField
                  look="box"
                  label="Title (Français)"
                  value={d.title_fr}
                  onChange={(e) => edit(event, { title_fr: e.target.value })}
                />
                <TextField
                  look="box"
                  label="Venue & area"
                  value={d.venue}
                  onChange={(e) => edit(event, { venue: e.target.value })}
                />
                <TextField
                  look="box"
                  label="Date"
                  type="date"
                  value={d.date}
                  onChange={(e) => edit(event, { date: e.target.value })}
                />
                <TextField
                  look="box"
                  label="Starts (Cameroon time)"
                  type="time"
                  value={d.start}
                  onChange={(e) => edit(event, { start: e.target.value })}
                />
                <TextField
                  look="box"
                  label="Ends (optional)"
                  type="time"
                  value={d.end}
                  onChange={(e) => edit(event, { end: e.target.value })}
                />
              </div>

              <div className={styles.maps}>
                <TextField
                  look="box"
                  label="Google Maps link"
                  type="url"
                  placeholder="https://maps.app.goo.gl/…"
                  value={d.maps_url}
                  onChange={(e) => edit(event, { maps_url: e.target.value })}
                />
                <ButtonLink
                  href={d.maps_url.trim() || mapsSearch(d.venue)}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="ghost"
                  size="sm"
                  className={styles.test}
                >
                  Test
                </ButtonLink>
              </div>

              {problems[event.id] && changed && (
                <p className={studio.error} role="alert" style={{ marginTop: 16 }}>
                  {problems[event.id]}
                </p>
              )}
            </section>
          </div>
        )
      })}

      {events.data.length === 0 && (
        <p className="muted">No moments yet. Use “Add moment” to start the programme.</p>
      )}

      {save.isError && !Object.keys(problems).length && (
        <p className={studio.error} role="alert">
          {studioErrorMessage(save.error)}
        </p>
      )}

      <SaveBar
        dirty={changedIds.length > 0}
        saving={save.isPending}
        onSave={() => save.mutate()}
        onDiscard={() => {
          setDrafts({})
          setProblems({})
        }}
        label={changedIds.length > 1 ? `Save ${changedIds.length} moments` : 'Save programme'}
      />
    </>
  )
}
