import { useRef, useState } from 'react'
import { Button } from '../../components/Button'
import { Dialog, DialogActions } from '../../components/Dialog'
import { Icon } from '../../components/Icon'
import { useToast } from '../../components/Toast'
import { formatPhone } from '../../lib/phone'
import { formatShortDateTime } from '../../lib/time'
import { ImportFormatError, parseGuestRows, type ParseResult } from '../guestImport'
import { importGuests, useApplyImport, type GuestRow, type ImportSummary } from '../guests'
import { studioErrorMessage } from '../queries'
import studio from '../studio.module.css'
import styles from './ImportPanel.module.css'

/** SheetJS is big, so it's loaded only when a spreadsheet button is used. */
const loadXlsx = () => import('xlsx')

type Preview = { fileName: string; parsed: ParseResult; summary: ImportSummary }

export function ImportPanel({ guests, origin }: { guests: GuestRow[]; origin: string }) {
  const toast = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const apply = useApplyImport()
  const [reading, setReading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [removeMissing, setRemoveMissing] = useState(false)
  const activeCount = guests.filter((g) => !g.deleted_at).length

  async function readFile(file: File) {
    setReading(true)
    setError(null)
    try {
      const XLSX = await loadXlsx()
      const book = XLSX.read(await file.arrayBuffer(), { type: 'array' })
      const sheet = book.Sheets[book.SheetNames[0]]
      const table = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, defval: '' })
      const parsed = parseGuestRows(table)
      if (parsed.rows.length === 0) throw new ImportFormatError('No guests found in this file.')
      const summary = await importGuests(parsed.rows, false) // preview only: nothing saved yet
      setRemoveMissing(false)
      setPreview({ fileName: file.name, parsed, summary })
    } catch (err) {
      setError(err instanceof ImportFormatError ? err.message : studioErrorMessage(err))
    } finally {
      setReading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function confirm() {
    if (!preview) return
    try {
      await apply.mutateAsync({ rows: preview.parsed.rows, removeMissing })
      const { added, changed, missing } = preview.summary
      toast(
        `Guest list updated: ${added.length} added, ${changed.length} changed` +
          (removeMissing && missing.length ? `, ${missing.length} removed` : ''),
      )
      setPreview(null)
    } catch (err) {
      toast(studioErrorMessage(err), 'error')
    }
  }

  async function downloadTemplate() {
    const XLSX = await loadXlsx()
    const sheet = XLSX.utils.aoa_to_sheet([
      ['Name', 'Phone'],
      ['Ama Ngono', '677123456'],
      ['Paul Etoa', '+237 6 99 88 77 66'],
    ])
    sheet['!cols'] = [{ wch: 32 }, { wch: 22 }]
    const book = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(book, sheet, 'Guests')
    XLSX.writeFile(book, 'guest-list-template.xlsx')
  }

  async function downloadList() {
    const XLSX = await loadXlsx()
    const reply = (g: GuestRow) =>
      g.attending === true ? 'Attending' : g.attending === false ? 'Declined' : 'No reply yet'
    const rows = guests
      .filter((g) => !g.deleted_at)
      .map((g) => ({
        Name: g.name,
        Phone: formatPhone(g.phone),
        Language: g.lang ?? '',
        'Invitation sent': formatShortDateTime(g.invite_sent_at),
        'First opened': formatShortDateTime(g.first_opened_at),
        'Times opened': g.open_count ?? 0,
        Reply: reply(g),
        'Dietary notes': g.diet ?? '',
        'Note to the couple': g.note ?? '',
        'Replied on': formatShortDateTime(g.responded_at),
        'Checked in': formatShortDateTime(g.last_checked_in_at),
        'Pass code': g.pass_code ?? '',
        'Private link': g.token ? `${origin}/i/${g.token}` : '',
      }))
    const book = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(rows), 'Guests')
    XLSX.writeFile(book, `guest-list-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  const summary = preview?.summary
  const nothingToDo =
    summary &&
    !summary.added.length &&
    !summary.changed.length &&
    !(removeMissing && summary.missing.length)

  return (
    <section className={studio.card} aria-labelledby="import-title">
      <h2 id="import-title">Guest list</h2>
      <p className={studio.lede} style={{ marginBottom: 20 }}>
        Upload an Excel or CSV file with a <strong>Name</strong> column and, optionally, a{' '}
        <strong>Phone</strong> column. Guests who already replied keep their answer.
      </p>

      <div className={styles.dropzone}>
        <div>
          <p className={styles.count}>{activeCount} guests on the list</p>
          <p className={studio.hint} style={{ marginTop: 2 }}>
            Numbers without a country code are treated as Cameroonian (+237).
          </p>
        </div>
        <div className={studio.row}>
          <Button variant="ghost" size="sm" onClick={downloadTemplate}>
            Template
          </Button>
          <Button variant="ghost" size="sm" onClick={downloadList} disabled={!activeCount}>
            Download list
          </Button>
          <input
            ref={inputRef}
            className="sr-only"
            type="file"
            accept=".xlsx,.xls,.csv"
            aria-label="Choose a guest list file"
            onChange={(e) => e.target.files?.[0] && readFile(e.target.files[0])}
          />
          <Button size="sm" loading={reading} onClick={() => inputRef.current?.click()}>
            <Icon name="plus" /> Upload list
          </Button>
        </div>
      </div>

      {error && (
        <p className={studio.error} role="alert" style={{ marginTop: 16 }}>
          {error}
        </p>
      )}

      <Dialog
        open={Boolean(preview)}
        title="Check before saving"
        wide
        onClose={() => setPreview(null)}
      >
        {preview && summary && (
          <>
            <p className={studio.lede}>
              Here is what <strong>{preview.fileName}</strong> would change. Nothing is saved until
              you apply it, and replies already received are kept.
            </p>

            <div className={styles.summary}>
              <div>
                <strong>{summary.added.length}</strong> new
              </div>
              <div>
                <strong>{summary.changed.length}</strong> changed
              </div>
              <div>
                <strong>{summary.unchanged}</strong> unchanged
              </div>
              <div>
                <strong>{summary.missing.length}</strong> not in the file
              </div>
            </div>

            {summary.added.length > 0 && (
              <details className={styles.details}>
                <summary>New guests ({summary.added.length})</summary>
                <ul>
                  {summary.added.map((g, i) => (
                    <li key={i}>
                      {g.name} <span className="muted">{formatPhone(g.phone)}</span>
                    </li>
                  ))}
                </ul>
              </details>
            )}

            {summary.changed.length > 0 && (
              <details className={styles.details}>
                <summary>Changed guests ({summary.changed.length})</summary>
                <ul>
                  {summary.changed.map((g) => (
                    <li key={g.id}>
                      {g.old_name !== g.name ? (
                        <>
                          {g.old_name} → <strong>{g.name}</strong>
                        </>
                      ) : (
                        g.name
                      )}{' '}
                      {g.old_phone !== g.phone && (
                        <span className="muted">
                          {formatPhone(g.old_phone) || 'no phone'} → {formatPhone(g.phone)}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </details>
            )}

            {summary.missing.length > 0 && (
              <div className={styles.missing}>
                <details className={styles.details}>
                  <summary>On the list but not in this file ({summary.missing.length})</summary>
                  <ul>
                    {summary.missing.map((g) => (
                      <li key={g.id}>
                        {g.name} <span className="muted">{formatPhone(g.phone)}</span>
                      </li>
                    ))}
                  </ul>
                </details>
                <label className={styles.check}>
                  <input
                    type="checkbox"
                    checked={removeMissing}
                    onChange={(e) => setRemoveMissing(e.target.checked)}
                  />
                  Remove them from the guest list (they can be restored for 60 days)
                </label>
              </div>
            )}

            {(preview.parsed.problems.length > 0 || preview.parsed.duplicates.length > 0) && (
              <div className={studio.error}>
                <p style={{ marginBottom: 6 }}>These rows will be skipped:</p>
                <ul className={styles.problems}>
                  {preview.parsed.problems.map((p) => (
                    <li key={`p${p.row}`}>
                      Row {p.row} {p.message}
                    </li>
                  ))}
                  {preview.parsed.duplicates.map((d) => (
                    <li key={`d${d.row}`}>
                      Row {d.row} ({d.name}) repeats an earlier row
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <DialogActions>
              <Button variant="ghost" onClick={() => setPreview(null)}>
                Cancel
              </Button>
              <Button onClick={confirm} loading={apply.isPending} disabled={Boolean(nothingToDo)}>
                {nothingToDo ? 'Nothing to change' : 'Apply changes'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </section>
  )
}
