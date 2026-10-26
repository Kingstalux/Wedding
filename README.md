# Wedding website

A private wedding site for one couple: guests open a personal invitation link
(RSVP, QR entrance pass, guest book, cash gifts), and the couple manages
everything from a studio at `/admin`.

- **Frontend:** Vite + React + TypeScript (single-page app)
- **Backend:** Supabase (Postgres database, auth for the studio, file storage)
- **Hosting:** Vercel (auto-deploys from GitHub)
- **Design reference:** [`mockup/`](mockup/): the approved static HTML mockup.
  Open `mockup/index.html` in a browser.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase dev project keys
npm run dev                  # http://localhost:5180
```

## Scripts

| Command             | What it does                         |
| ------------------- | ------------------------------------ |
| `npm run dev`       | Start the dev server with hot reload |
| `npm run build`     | Type-check and build to `dist/`      |
| `npm run preview`   | Serve the production build locally   |
| `npm run lint`      | Lint with oxlint                     |
| `npm run typecheck` | Run the TypeScript compiler only     |
| `npm test`          | Run unit tests (Vitest)              |
| `npm run format`    | Format all files with Prettier       |

## Environments

| Where             | Supabase project | Env vars set in         |
| ----------------- | ---------------- | ----------------------- |
| Your machine      | `wedding-dev`    | `.env.local`            |
| Vercel previews   | `wedding-dev`    | Vercel → Preview env    |
| Vercel production | `wedding-prod`   | Vercel → Production env |
