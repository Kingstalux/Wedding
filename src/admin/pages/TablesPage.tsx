import { useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent, type ReactNode } from 'react'
import { Button } from '../../components/Button'
import { useConfirm } from '../../components/Confirm'
import { Dialog, DialogActions } from '../../components/Dialog'
import { SelectField, Switch, TextField } from '../../components/Form'
import { Icon } from '../../components/Icon'
import { IconButton } from '../../components/IconButton'
import { Select } from '../../components/Select'
import { useToast } from '../../components/Toast'
import { cx } from '../../lib/cx'
import { fullNames } from '../../lib/guestNames'
import { useGuests, type GuestRow } from '../guests'
import { studioErrorMessage, useSettings, useUpdateSettings } from '../queries'
import {
  buildTables,
  seatsLabel,
  tablesWithRoom,
  useDeleteReservation,
  useMoveGuest,
  useReservations,
  useSaveReservation,
  useSeatWaiting,
  useSetTableSeats,
  useTableSeats,
  waitingGuests,
  type Reservation,
  type TableInfo,
} from '../tables'
import studio from '../studio.module.css'
import styles from './TablesPage.module.css'

/*
 * "Tables & seating": who sits where. Guests who accept are seated
 * automatically (couples together); here the couple can move anyone and
 * reserve seats for people without an invitation.
 */
export function TablesPage() {
  const toast = useToast()
  const confirm = useConfirm()
  const settings = useSettings()
  const guests = useGuests()
  const reservations = useReservations()
  const tableSeats = useTableSeats()
  const move = useMoveGuest()
  const seatWaiting = useSeatWaiting()
  const removeReservation = useDeleteReservation()
  const [editing, setEditing] = useState<Reservation | 'new' | null>(null)

  if (settings.isPending || guests.isPending || reservations.isPending || tableSeats.isPending) {
    return <p className={studio.loading}>Loading tables…</p>
  }
  const loadError = settings.error ?? guests.error ?? reservations.error ?? tableSeats.error
  if (loadError || !settings.data) {
    return <p className={studio.error}>{studioErrorMessage(loadError)}</p>
  }

  const { table_count: count, table_capacity: capacity } = settings.data
  const allGuests = guests.data ?? []
  const tables = buildTables(
    count,
    capacity,
    allGuests,
    reservations.data ?? [],
    tableSeats.data ?? [],
  )
  const waiting = waitingGuests(allGuests)
  const used = tables.reduce((sum, t) => sum + t.used, 0)
  const totalSeats = tables.reduce((sum, t) => sum + t.capacity, 0)
  const full = tables.filter((t) => t.free <= 0).length

  async function moveTo(g: GuestRow, table: number | null) {
    const who = fullNames(g.name ?? '', g.partner_name)
    try {
      await move.mutateAsync({ id: g.id!, table })
      toast(table ? `${who} → Table ${table}` : `${who} is waiting for a table`)
    } catch (err) {
      toast(studioErrorMessage(err), 'error')
    }
  }

  async function seatEveryone() {
    try {
      const seated = (await seatWaiting.mutateAsync(undefined)) as number
      const left = waiting.length - seated
      toast(
        seated === 0
          ? 'No table has room for the people waiting'
          : `${seated} seated${left > 0 ? `, ${left} still waiting (no room)` : ''}`,
      )
    } catch (err) {
      toast(studioErrorMessage(err), 'error')
    }
  }

  async function deleteReservation(r: Reservation) {
    const ok = await confirm({
      title: `Remove the reservation “${r.label}”?`,
      message: `${seatsLabel(r.seats)} at Table ${r.table_no} become free again.`,
      confirmLabel: 'Remove',
      danger: true,
    })
    if (!ok) return
    try {
      await removeReservation.mutateAsync(r.id)
      toast('Reservation removed')
    } catch (err) {
      toast(studioErrorMessage(err), 'error')
    }
  }

  /** The "Move to…" dropdown for one guest. */
  function moveSelect(g: GuestRow) {
    const options = tablesWithRoom(tables, g.seats ?? 1, g.table_no).map((t) => ({
      value: String(t.number),
      label: `Table ${t.number} · ${t.free} free`,
    }))
    return (
      <Select
        className={styles.move}
        value=""
        placeholder={g.table_no ? 'Move to…' : 'Choose a table…'}
        aria-label={`Move ${fullNames(g.name ?? '', g.partner_name)} to another table`}
        options={options}
        disabled={!options.length || move.isPending}
        onChange={(v) => moveTo(g, Number(v))}
      />
    )
  }

  return (
    <>
      <div className={studio.pageHead}>
        <div>
          <h1 className="display">Tables &amp; seating</h1>
          <p>
            Guests who accept are seated automatically, couples together. Move anyone, or reserve
            seats for people without an invitation.
          </p>
        </div>
        <Button onClick={() => setEditing('new')}>
          <Icon name="plus" /> Reserve seats
        </Button>
      </div>

      <section className={styles.summary} aria-label="Seating figures">
        <div>
          <strong>
            {used} / {totalSeats}
          </strong>
          <span>Seats taken</span>
        </div>
        <div>
          <strong>
            {full} / {count}
          </strong>
          <span>Tables full</span>
        </div>
        <div>
          <strong>{waiting.length}</strong>
          <span>Waiting for a table</span>
        </div>
      </section>

      {waiting.length > 0 && (
        <section className={studio.card} aria-labelledby="waiting-title">
          <div className={studio.cardHead}>
            <div>
              <h2 id="waiting-title">Waiting for a table</h2>
              <p className={studio.lede}>
                They accepted, but no table had room, or they were unseated by hand.
              </p>
            </div>
            <Button size="sm" onClick={seatEveryone} loading={seatWaiting.isPending}>
              Seat everyone waiting
            </Button>
          </div>
          <ul className={styles.people}>
            {waiting.map((g) => (
              <li key={g.id}>
                <Person guest={g} />
                {moveSelect(g)}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className={styles.grid} aria-label="Tables">
        {tables.map((t) => (
          <TableCard
            key={t.number}
            table={t}
            defaultCapacity={capacity}
            moveSelect={moveSelect}
            onUnseat={(g) => moveTo(g, null)}
            onEditReservation={setEditing}
            onDeleteReservation={deleteReservation}
          />
        ))}
      </section>

      <TableSettings key={`${count}-${capacity}`} />

      {editing && (
        <ReservationDialog
          reservation={editing === 'new' ? null : editing}
          tables={tables}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  )
}

function Person({ guest }: { guest: GuestRow }) {
  return (
    <span className={styles.person}>
      <span>{fullNames(guest.name ?? '', guest.partner_name)}</span>
      {guest.partner_name && <span className={styles.tag}>Couple</span>}
      {guest.table_locked && (
        <span className={styles.locked} title="Placed by hand">
          <Icon name="lock" size={12} />
          <span className="sr-only">Placed by hand</span>
        </span>
      )}
    </span>
  )
}

function TableCard({
  table,
  defaultCapacity,
  moveSelect,
  onUnseat,
  onEditReservation,
  onDeleteReservation,
}: {
  table: TableInfo
  defaultCapacity: number
  moveSelect: (g: GuestRow) => ReactNode
  onUnseat: (g: GuestRow) => void
  onEditReservation: (r: Reservation) => void
  onDeleteReservation: (r: Reservation) => void
}) {
  const [editingSeats, setEditingSeats] = useState(false)
  const empty = !table.guests.length && !table.reservations.length
  const { capacity } = table
  return (
    <article className={cx(styles.table, table.free <= 0 && styles.full)}>
      <header>
        <h2>Table {table.number}</h2>
        <span className={styles.count}>
          {table.used}/{capacity}
          {table.custom && <span className={styles.own}> · own seats</span>}
        </span>
        <IconButton
          icon="edit"
          size="sm"
          label={`Change the seats at Table ${table.number}`}
          aria-expanded={editingSeats}
          onClick={() => setEditingSeats((v) => !v)}
        />
      </header>
      <div className={styles.bar} aria-hidden="true">
        <i style={{ width: `${Math.min(100, (table.used / capacity) * 100)}%` }} />
      </div>
      {editingSeats && (
        <SeatsForm
          table={table}
          defaultCapacity={defaultCapacity}
          onDone={() => setEditingSeats(false)}
        />
      )}
      {empty ? (
        <p className={styles.empty}>Empty</p>
      ) : (
        <ul className={styles.people}>
          {table.reservations.map((r) => (
            <li key={r.id}>
              <span className={styles.person}>
                <span>{r.label}</span>
                <span className={cx(styles.tag, styles.reserved)}>
                  Reserved · {seatsLabel(r.seats)}
                </span>
                {r.note && <span className={styles.note}>{r.note}</span>}
              </span>
              <span className={styles.rowActions}>
                <IconButton
                  icon="edit"
                  size="sm"
                  label={`Edit the reservation ${r.label}`}
                  onClick={() => onEditReservation(r)}
                />
                <IconButton
                  icon="trash"
                  size="sm"
                  label={`Remove the reservation ${r.label}`}
                  onClick={() => onDeleteReservation(r)}
                />
              </span>
            </li>
          ))}
          {table.guests.map((g) => (
            <li key={g.id}>
              <Person guest={g} />
              <span className={styles.rowActions}>
                {moveSelect(g)}
                <IconButton
                  icon="close"
                  size="sm"
                  label={`Unseat ${fullNames(g.name ?? '', g.partner_name)}`}
                  onClick={() => onUnseat(g)}
                />
              </span>
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}

/** One table's own number of seats, or back to the default. */
function SeatsForm({
  table,
  defaultCapacity,
  onDone,
}: {
  table: TableInfo
  defaultCapacity: number
  onDone: () => void
}) {
  const toast = useToast()
  const setSeats = useSetTableSeats()
  const [value, setValue] = useState(String(table.capacity))
  const [error, setError] = useState<string | null>(null)

  async function save(seats: number | null) {
    if (seats !== null && (!Number.isInteger(seats) || seats < 1 || seats > 30)) {
      return setError('A number from 1 to 30.')
    }
    if (seats !== null && seats < table.used) {
      return setError(`${table.used} seats are already taken here. Move someone first.`)
    }
    setError(null)
    try {
      // The default number needs no row of its own.
      await setSeats.mutateAsync({
        table: table.number,
        seats: seats === defaultCapacity ? null : seats,
      })
      toast(`Table ${table.number}: ${seatsLabel(seats ?? defaultCapacity)}`)
      onDone()
    } catch (err) {
      setError(studioErrorMessage(err))
    }
  }

  return (
    <form
      className={styles.seatsForm}
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        save(Number(value))
      }}
    >
      <TextField
        look="box"
        label={`Seats at Table ${table.number}`}
        type="number"
        inputMode="numeric"
        min={1}
        max={30}
        value={value}
        error={error}
        onChange={(e) => setValue(e.target.value)}
      />
      <div className={styles.seatsActions}>
        <Button type="submit" size="sm" loading={setSeats.isPending}>
          Save
        </Button>
        {table.custom && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={setSeats.isPending}
            onClick={() => save(null)}
          >
            Use default ({defaultCapacity})
          </Button>
        )}
      </div>
    </form>
  )
}

/** Number of tables, default seats per table, and whether guests see their table. */
function TableSettings() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const settings = useSettings().data!
  const update = useUpdateSettings()
  const [count, setCount] = useState(String(settings.table_count))
  const [capacity, setCapacity] = useState(String(settings.table_capacity))
  const [error, setError] = useState<string | null>(null)

  async function save(e: FormEvent) {
    e.preventDefault()
    const c = Number(count)
    const cap = Number(capacity)
    if (!Number.isInteger(c) || c < 1 || c > 100) return setError('Tables: a number from 1 to 100.')
    if (!Number.isInteger(cap) || cap < 1 || cap > 30)
      return setError('Default seats per table: a number from 1 to 30.')
    setError(null)
    try {
      await update.mutateAsync({ table_count: c, table_capacity: cap })
      // More room seats the waiting guests; fewer tables forget their own seats.
      queryClient.invalidateQueries({ queryKey: ['admin'] })
      toast('Tables saved')
    } catch (err) {
      setError(studioErrorMessage(err))
    }
  }

  async function toggleShown(show: boolean) {
    try {
      await update.mutateAsync({ show_tables: show })
      toast(show ? 'Guests now see their table' : 'Tables hidden from the invitation')
    } catch (err) {
      toast(studioErrorMessage(err), 'error')
    }
  }

  const changed =
    count !== String(settings.table_count) || capacity !== String(settings.table_capacity)

  return (
    <section className={studio.card} aria-labelledby="table-settings-title">
      <h2 id="table-settings-title">Tables</h2>
      <p className={studio.lede} style={{ marginBottom: 20 }}>
        Guests who accepted see a plan with their table highlighted.
      </p>
      <Switch
        label="Show “Your table” on the invitation"
        checked={settings.show_tables}
        onChange={(e) => toggleShown(e.target.checked)}
      />
      <form onSubmit={save} noValidate className={styles.settings}>
        <TextField
          look="box"
          label="Number of tables"
          type="number"
          inputMode="numeric"
          min={1}
          max={100}
          value={count}
          onChange={(e) => setCount(e.target.value)}
        />
        <TextField
          look="box"
          label="Default seats per table"
          hint="Tables with their own number keep it."
          type="number"
          inputMode="numeric"
          min={1}
          max={30}
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
        />
        <Button type="submit" variant="ghost" loading={update.isPending} disabled={!changed}>
          Save
        </Button>
      </form>
      {error && (
        <p className={studio.error} role="alert" style={{ marginTop: 12 }}>
          {error}
        </p>
      )}
    </section>
  )
}

/** Reserve seats for people without an invitation (or edit a reservation). */
function ReservationDialog({
  reservation,
  tables,
  onClose,
}: {
  reservation: Reservation | null
  tables: TableInfo[]
  onClose: () => void
}) {
  const toast = useToast()
  const save = useSaveReservation()
  const [label, setLabel] = useState(reservation?.label ?? '')
  const [seats, setSeats] = useState(String(reservation?.seats ?? 1))
  const [table, setTable] = useState(reservation ? String(reservation.table_no) : '')
  const [note, setNote] = useState(reservation?.note ?? '')
  const [error, setError] = useState<string | null>(null)

  const n = Number(seats)
  // Its own seats count as free when editing at the same table.
  const freeAt = (t: TableInfo) =>
    t.free + (reservation && reservation.table_no === t.number ? reservation.seats : 0)
  const options = tables
    .filter((t) => freeAt(t) >= (Number.isInteger(n) && n > 0 ? n : 1))
    .map((t) => ({ value: String(t.number), label: `Table ${t.number} · ${freeAt(t)} free` }))

  async function submit(e: FormEvent) {
    e.preventDefault()
    const cleanLabel = label.trim().replace(/\s+/g, ' ')
    if (!cleanLabel) return setError('Please give the reservation a name, e.g. “Bride’s family”.')
    if (!Number.isInteger(n) || n < 1) return setError('Seats: a whole number, at least 1.')
    if (!table) return setError('Please choose a table.')
    try {
      await save.mutateAsync({
        id: reservation?.id,
        label: cleanLabel,
        seats: n,
        table_no: Number(table),
        note: note.trim(),
      })
      toast(`${seatsLabel(n)} reserved at Table ${table}`)
      onClose()
    } catch (err) {
      setError(studioErrorMessage(err))
    }
  }

  return (
    <Dialog open title={reservation ? 'Edit reservation' : 'Reserve seats'} onClose={onClose}>
      <form onSubmit={submit} noValidate style={{ display: 'contents' }}>
        <TextField
          look="box"
          label="Name"
          placeholder="e.g. Bride’s family, Uncle Paul"
          maxLength={80}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          autoFocus
        />
        <TextField
          look="box"
          label="Number of seats"
          type="number"
          inputMode="numeric"
          min={1}
          max={30}
          value={seats}
          onChange={(e) => setSeats(e.target.value)}
        />
        <SelectField
          look="box"
          label="Table"
          value={table}
          placeholder={options.length ? 'Choose a table…' : 'No table has that many free seats'}
          options={options}
          onChange={setTable}
          hint="Only tables with enough free seats are listed."
        />
        <TextField
          look="box"
          label="Note (optional)"
          placeholder="e.g. arriving from Douala"
          maxLength={200}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        {error && (
          <p className={studio.error} role="alert">
            {error}
          </p>
        )}
        <DialogActions>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={save.isPending}>
            {reservation ? 'Save' : 'Reserve'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
