import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

// Vite exposes variables that start with VITE_ through import.meta.env.
// Locally they come from .env.local; on Vercel from the project's env settings.
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  throw new Error(
    'Missing Supabase settings. Copy .env.example to .env.local and fill in ' +
      'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then restart `npm run dev`.',
  )
}

/**
 * The one Supabase client for the whole app.
 *
 * It talks to three Supabase services over HTTPS:
 *  - the database (tables + functions), through the auto-generated REST API
 *  - auth (the couple's studio sign-in); the session is kept in localStorage
 *  - storage (photos and music in the `media` bucket)
 *
 * The publishable/anon key only identifies the project. What it may read or
 * write is decided inside Postgres by Row Level Security policies.
 *
 * <Database> comes from `npm run db:types`, generated from the real schema:
 * TypeScript then checks every table name, column and function argument.
 * Re-run it after each new migration.
 */
export const supabase = createClient<Database>(url, key)
