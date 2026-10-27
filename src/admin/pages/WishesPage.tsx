import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Button } from '../../components/Button'
import { Switch } from '../../components/Form'
import { useToast } from '../../components/Toast'
import { cx } from '../../lib/cx'
import { supabase } from '../../lib/supabase'
import { formatShortDateTime } from '../../lib/time'
import { studioErrorMessage, useSettings, useUpdateSettings } from '../queries'
import studio from '../studio.module.css'
import styles from './GuestsPage.module.css'

const wishesKey = ['admin', 'wishes'] as const
type Filter = 'all' | 'visible' | 'hidden'

export function WishesPage() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const settings = useSettings()
  const updateSettings = useUpdateSettings()
  const [filter, setFilter] = useState<Filter>('all')

  const wishes = useQuery({
    queryKey: wishesKey,
    queryFn: async () => {
      // guests(name): Supabase follows the guest_id foreign key and adds the guest's name.
      const { data, error } = await supabase
        .from('wishes')
        .select('id, message, hidden, created_at, guests(name)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })

  const change = useMutation({
    mutationFn: async (action: { id: string; hide?: boolean; remove?: boolean }) => {
      const result = action.remove
        ? await supabase.from('wishes').delete().eq('id', action.id)
        : await supabase.from('wishes').update({ hidden: action.hide }).eq('id', action.id)
      if (result.error) throw result.error
    },
    onSuccess: (_d, action) => {
      queryClient.invalidateQueries({ queryKey: wishesKey })
      toast(
        action.remove ? 'Message deleted' : action.hide ? 'Hidden from the site' : 'Visible again',
      )
    },
    onError: (err) => toast(studioErrorMessage(err), 'error'),
  })

  const list = wishes.data ?? []
  const counts = {
    all: list.length,
    visible: list.filter((w) => !w.hidden).length,
    hidden: list.filter((w) => w.hidden).length,
  }
  const shown = list.filter((w) => filter === 'all' || (filter === 'hidden') === w.hidden)
  const enabled = settings.data?.show_wishes ?? true

  return (
    <>
      <div className={studio.pageHead}>
        <div>
          <h1 className="display">Guest book</h1>
          <p>Hide a message to take it off the site without deleting it.</p>
        </div>
        <Switch
          label={enabled ? 'Guest book shown on the site' : 'Guest book hidden from the site'}
          checked={enabled}
          disabled={!settings.data || updateSettings.isPending}
          onChange={(e) =>
            updateSettings.mutate(
              { show_wishes: e.target.checked },
              { onError: (err) => toast(studioErrorMessage(err), 'error') },
            )
          }
        />
      </div>

      <div className={styles.chips} role="group" aria-label="Filter messages">
        {(['all', 'visible', 'hidden'] as const).map((key) => (
          <button
            key={key}
            type="button"
            className={styles.chip}
            aria-pressed={filter === key}
            onClick={() => setFilter(key)}
          >
            {key === 'all' ? 'All' : key === 'visible' ? 'Visible' : 'Hidden'} <b>{counts[key]}</b>
          </button>
        ))}
      </div>

      {wishes.isPending && <p className={studio.loading}>Loading…</p>}
      {wishes.isError && <p className={studio.error}>{studioErrorMessage(wishes.error)}</p>}
      {wishes.isSuccess && shown.length === 0 && <p className="muted">No messages here yet.</p>}

      {shown.map((wish) => (
        <article key={wish.id} className={cx(studio.card, wish.hidden && studio.dimmed)}>
          <div className={styles.toolbar}>
            <p>
              <strong style={{ fontWeight: 500, color: 'var(--emerald)' }}>
                {wish.guests?.name ?? 'Removed guest'}
              </strong>{' '}
              <span className="muted">· {formatShortDateTime(wish.created_at)}</span>
              {wish.hidden && <span className={cx(styles.badge, styles.waiting)}> Hidden</span>}
            </p>
            <div className={studio.row}>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => change.mutate({ id: wish.id, hide: !wish.hidden })}
              >
                {wish.hidden ? 'Show again' : 'Hide'}
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() =>
                  window.confirm('Delete this message? This cannot be undone.') &&
                  change.mutate({ id: wish.id, remove: true })
                }
              >
                Delete
              </Button>
            </div>
          </div>
          <p className="serif-body" style={{ marginTop: 10, whiteSpace: 'pre-line' }}>
            {wish.message}
          </p>
        </article>
      ))}
    </>
  )
}
