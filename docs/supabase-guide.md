# Supabase: setup and how it connects to React

This guide follows the build. Each part says **what to do** and **why**.
Parts marked ✅ are done; ⏳ are coming in later steps.

---

## 1. The big picture

```
 Guest's phone / couple's laptop
 ┌──────────────────────────────┐
 │  React app (built by Vite)   │   hosted on Vercel as static files
 │                              │
 │  src/lib/supabase.ts ────────┼──── HTTPS + publishable key ───┐
 └──────────────────────────────┘                                 │
                                                                  ▼
                                   ┌──────────────── Supabase project ────────────────┐
                                   │  REST API (PostgREST) → Postgres database        │
                                   │      tables  + Row Level Security policies       │
                                   │      functions (rpc) e.g. get_invitation(token)  │
                                   │  Auth  → the couple's email/password sign-in     │
                                   │  Storage → bucket "media" (photos, music)        │
                                   └──────────────────────────────────────────────────┘
```

- **There is no server of our own.** The React app runs in the browser and talks
  straight to Supabase. Supabase turns every table and SQL function into a web API.
- **The publishable key only identifies the project.** It is public: anyone can see it
  in the page's JavaScript. That's fine, because it gives no rights by itself.
- **Row Level Security (RLS) is the real gatekeeper.** Rules written in SQL, inside
  Postgres, decide what each request can read or change.
  - Anonymous visitors can't read **any** table, not even the programme or the names.
  - Guests get the wedding content and act only through SQL **functions** that take
    their private token (`get_invitation`, `submit_rsvp`, …).
  - The couple, once signed in, can do everything. The database checks this through an `admins` table.
- **The secret key (`service_role`) bypasses RLS.** It never goes into the app or into git.

## 2. Two projects, one codebase ✅

| Project        | Ref                    | Used by                                      |
| -------------- | ---------------------- | -------------------------------------------- |
| `wedding-dev`  | `rfjjsbpalzxztezufhlw` | your machine (`.env.local`), Vercel previews |
| `wedding-prod` | `ghkpeaclgqnpxfuzobcs` | the real site the couple and guests use      |

Both projects get the **same schema** from the SQL files in `supabase/migrations/`.
Only the **data** differs: test guests live in dev; real guests live in prod.

## 3. Local setup ✅

1. Install the CLI and sign in: `brew install supabase/tap/supabase` then `supabase login`.
2. Copy the env template: `cp .env.example .env.local`, then paste the **dev** URL and
   publishable key (Dashboard → Connect).
3. `supabase init` created `supabase/config.toml`. The CLI needs it.
   Its settings mostly apply to a local Docker stack, which we don't use.
4. [`src/lib/supabase.ts`](../src/lib/supabase.ts) creates **one** client for the whole app
   from those two env variables. Every database, auth and storage call goes through it.

> Vite only reads `.env.local` when it starts, so restart `npm run dev` after editing it.

## 4. Link the CLI to the dev project 👉 your turn

The CLI needs to know which cloud project to push SQL to. Run this in the project folder:

```bash
supabase link --project-ref rfjjsbpalzxztezufhlw
```

It asks for the **dev database password** you saved when creating the project.
Linking writes to `supabase/.temp/`, which git ignores. Run `supabase link`
again with the prod ref only when we deploy (Step 16).

## 5. Dashboard settings to change now 👉 your turn (dev project)

1. **Authentication → Sign In / Providers → Email**: turn **off** "Allow new users to sign up".
   Nobody can create an account from the website; the couple's account is created by hand.
2. **Authentication → URL Configuration**:
   - Site URL: `http://localhost:5180`
   - Redirect URLs: add `http://localhost:5180/**`
     These are used by the "forgot password" email link.

Do the same in **prod** at Step 16, using the Vercel address instead of localhost.

## 6. Migrations: how the database is built ✅ Step 4 (first file)

Each change to the database is a SQL file in `supabase/migrations/`, committed to git.
Create one with the CLI, which adds a timestamp so files always run in order:

```bash
supabase migration new security      # → supabase/migrations/20261027…_security.sql
```

| File                    | What it adds                                         |
| ----------------------- | ---------------------------------------------------- |
| `…_schema.sql` ✅       | the 9 tables, with RLS switched on (deny everything) |
| `…_security.sql`        | `is_admin()` + the RLS policies                      |
| `…_guest_functions.sql` | `get_invitation`, `submit_rsvp`, `post_wish`…        |
| `…_admin_functions.sql` | `import_guests`, `check_in`, `dashboard_stats`…      |
| `…_storage.sql`         | the `media` bucket and who may upload                |

```bash
supabase db push --linked --dry-run  # shows what would run, changes nothing
npm run db:push                      # applies new files to the linked project
npm run db:types                     # regenerates src/lib/database.types.ts
supabase migration list --linked     # which files have run
```

Supabase records which files have already run, so `db push` is safe to repeat.
**Never edit a file that has already been pushed.** Add a new one instead.

After `db:types`, the client is `createClient<Database>(…)`, so TypeScript knows
every table and column: a typo like `supabase.from('gusets')` fails to compile.

## 7. How React talks to Supabase ⏳ Steps 6–14

**Guests: everything goes through functions** (the token proves who the guest is).
`get_invitation` returns the settings, programme, gallery, the guest's reply and the
guest book in one call; errors come back as short codes the site translates:

```ts
const { data, error } = await supabase.rpc('get_invitation', { p_token: token })
await supabase.rpc('submit_rsvp', { p_token: token, p_attending: true, p_diet: '', p_note: '' })
await supabase.rpc('post_wish', { p_token: token, p_message: 'Congratulations!' })
// error.message === 'links_not_allowed' | 'rate_limited' | 'rsvp_closed' | 'invalid_token' …
```

**The couple: tables directly** (allowed because RLS sees an admin) **plus a few functions:**

```ts
const { data } = await supabase.from('guest_list').select('*').is('deleted_at', null)
await supabase.from('events').update({ maps_url }).eq('id', eventId)
const { data: stats } = await supabase.rpc('dashboard_stats')
```

**Couple sign-in:**

```ts
await supabase.auth.signInWithPassword({ email, password })
supabase.auth.onAuthStateChange((_event, session) => {
  /* update UI */
})
```

**Uploads:**

```ts
await supabase.storage.from('media').upload(`gallery/${crypto.randomUUID()}.jpg`, file)
const url = supabase.storage.from('media').getPublicUrl(path).data.publicUrl
```

In components these calls are wrapped in **React Query** hooks (`useQuery` /
`useMutation`). React Query handles loading states and caching, and refreshes data
after a change, e.g. the RSVP section updates after "Submit".

## 8. Proving it’s secure ✅ Step 5

`npm run check:rls` acts like a stranger who only has the publishable key. It tries
to read `guests`, `rsvps`, `wishes`, `gift_announcements` and `checkins`, and it
**fails the build if any of them return rows**. We run it against dev and prod.

## 9. Deploying ⏳ Step 16

- `supabase link --project-ref ghkpeaclgqnpxfuzobcs` then `supabase db push`, which applies the same migrations to prod.
- Vercel env vars:
  - **Production** → the prod URL and key
  - **Preview** → the dev URL and key
- Create the couple's user in prod, add it to `admins`, and disable sign-ups.

## Free plan notes

- Free projects **pause after 7 days without activity**. Open the site or the dashboard
  weekly, or upgrade the prod project for the weeks around the wedding.
- There are 2 free projects per organization, which you're now using.
