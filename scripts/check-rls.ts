/*
 * Security check: behaves like a stranger who only has the public key
 * (anyone can find it in the website's JavaScript) and tries to get at
 * private data. Every check must pass before deploying.
 *
 *   npm run check:rls            → dev project (.env.local), with test-guest checks
 *   npm run check:rls:prod       → prod project (.env.production.local)
 *
 * Exits with code 1 if anything is exposed.
 */
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../src/lib/database.types'

const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_ANON_KEY
const testToken = process.env.RLS_TEST_TOKEN // only set for dev, where test guests exist

if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY')
  process.exit(1)
}

const anon = createClient<Database>(url, key, { auth: { persistSession: false } })
let failures = 0

function report(ok: boolean, label: string, detail = '') {
  if (!ok) failures++
  console.log(`${ok ? '✓' : '✗'} ${label}${detail ? `  (${detail})` : ''}`)
}

console.log(`Checking ${url} as an anonymous visitor\n`)

// 1. No table can be read directly, not even the programme or settings.
const tables = [
  'settings',
  'events',
  'gallery_photos',
  'guests',
  'rsvps',
  'checkins',
  'wishes',
  'admins',
  'guest_list',
] as const
for (const table of tables) {
  const { data, error } = await anon.from(table).select('*').limit(5)
  const rows = data?.length ?? 0
  report(rows === 0, `cannot read ${table}`, error ? error.message : `${rows} rows`)
}

// 2. Nothing can be written directly.
{
  const { error } = await anon.from('guests').insert({ name: 'Intruder' })
  report(Boolean(error), 'cannot add a guest', error?.message ?? 'INSERT SUCCEEDED')
}
{
  const { data } = await anon.from('settings').update({ bride: 'Hacked' }).eq('id', true).select()
  report((data?.length ?? 0) === 0, 'cannot change settings')
}
{
  const { data } = await anon.from('wishes').delete().neq('message', '').select()
  report((data?.length ?? 0) === 0, 'cannot delete wishes')
}

// 3. Studio functions refuse anonymous callers.
{
  const { error } = await anon.rpc('dashboard_stats')
  report(Boolean(error), 'cannot read studio figures', error?.message ?? 'RETURNED DATA')
}
{
  const { error } = await anon.rpc('import_guests', { p_rows: [{ name: 'x' }], p_apply: true })
  report(Boolean(error), 'cannot import guests', error?.message ?? 'RAN')
}
{
  const { error } = await anon.rpc('check_in', {
    p_code: 'DEMOBB',
    p_event_id: '00000000-0000-4000-8000-000000000001',
  })
  report(Boolean(error), 'cannot check guests in', error?.message ?? 'RAN')
}

// 4. A wrong link gets nothing.
{
  const { data } = await anon.rpc('get_invitation', { p_token: 'not-a-real-token' })
  report(data === null, 'wrong invitation link returns nothing')
}
{
  const { error } = await anon.rpc('submit_rsvp', {
    p_token: 'not-a-real-token',
    p_attending: true,
  })
  report(Boolean(error), 'cannot reply without a valid link', error?.message ?? 'ACCEPTED')
}

// 5. Storage: no listing, no uploads.
{
  const { data } = await anon.storage.from('media').list()
  report((data?.length ?? 0) === 0, 'cannot list stored files')
}
{
  // An allowed file type, so a refusal can only come from the security rules.
  const png = Uint8Array.from(
    atob(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGD4DwABBAEAwS2OUAAAAABJRU5ErkJggg==',
    ),
    (c) => c.charCodeAt(0),
  )
  const { error } = await anon.storage
    .from('media')
    .upload(`gallery/rls-check-${Date.now()}.png`, new Blob([png], { type: 'image/png' }))
  report(Boolean(error), 'cannot upload files', error?.message ?? 'UPLOADED')
}

// 6. Dev only: a valid link works and reveals only what it should.
//    Skipped (not failed) when the test guest has been removed from the list.
if (testToken) {
  const { data, error } = await anon.rpc('get_invitation', { p_token: testToken })
  const inv = data as Record<string, unknown> | null
  if (!inv && !error) {
    console.log(`– skipped: test guest "${testToken}" is not on the guest list`)
  } else {
    report(Boolean(inv?.guest), `valid link "${testToken}" opens the invitation`, error?.message)
    const settings = (inv?.settings ?? {}) as Record<string, unknown>
    report(!('wa_template_en' in settings), 'invitation hides the WhatsApp templates')

    const code = String((inv?.guest as Record<string, unknown>)?.pass_code ?? '')
    const { data: pass } = await anon.rpc('read_pass', { p_code: code })
    const keys = Object.keys((pass ?? {}) as object).sort()
    report(
      JSON.stringify(keys) === JSON.stringify(['attending', 'checked_in', 'first_name']),
      'scanned pass shows only first name and status',
      keys.join(', '),
    )
  }
}

// 7. The one public photo (for the "invitation is personal" page) is just a file path.
{
  const { data, error } = await anon.rpc('get_cover_photo')
  report(
    !error && (data === null || (typeof data === 'string' && data.startsWith('word/'))),
    'public cover photo reveals only a photo path',
    error?.message ?? String(data),
  )
}

console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) FAILED.`)
process.exit(failures === 0 ? 0 : 1)
