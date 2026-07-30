# odysseus

Travel slideshow app — create journeys with interactive maps, photos, and videos. Built with Next.js, Drizzle ORM, Neon (Postgres), Leaflet, and Vercel Blob.

---

## Quick start

### Prerequisites

- Node.js 20+
- Docker (for local Postgres)

### Setup

```bash
# 1. Start Postgres and create tables
npm run setup

# 2. Start the dev server
npm run dev
```

Open **http://localhost:3456** in your browser.

The app is fully functional with local Postgres and file storage (`public/uploads/`). No API keys needed for development.

---

## Environment

| Variable | Required | Dev value | Prod value |
|----------|----------|-----------|------------|
| `NEON_DATABASE_URL` | Yes | `postgres://odysseus:odysseus@localhost:5432/odysseus` | Neon connection string |
| `BLOB_READ_WRITE_TOKEN` | No (dev) | *(leave empty)* | Vercel Blob token |

Environment files:
- `.env.development` — loaded automatically in `next dev`
- `.env.local` — overrides for local secrets (gitignored)

---

## Development

### Database

```bash
npm run db:push      # Push schema changes to the database
npm run db:generate  # Generate a migration file after schema edits
npm run db:studio    # Open Drizzle Studio (web UI to browse/query data)
```

Schema lives in `db/schema.ts`. After editing it, run `npm run db:push` to apply changes.

### File storage

In development (no `BLOB_READ_WRITE_TOKEN` set), uploaded files are saved to `public/uploads/` and served at `/uploads/...`. This directory is gitignored.

Set `BLOB_READ_WRITE_TOKEN` to switch to Vercel Blob (production).

### Project structure

```
app/
  page.tsx                           # Dashboard — list of journeys
  journeys/new/page.tsx              # Create a journey
  journeys/[id]/page.tsx             # View journey + slideshow
  journeys/[id]/edit/page.tsx        # Edit journey (locations, media, reorder)
  api/journeys/                      # Journey CRUD
  api/journeys/[id]/locations/       # Location CRUD + reorder
  api/locations/[id]/media/          # Media CRUD + reorder
  api/upload/                        # File upload (Vercel Blob or local)
db/schema.ts                         # Drizzle schema (3 tables)
components/
  ui/                                # shadcn/ui components
  map/Map.tsx                        # Leaflet map with markers
  map/MapWrapper.tsx                 # Dynamic import (ssr: false)
  media/MediaUploader.tsx            # Upload + save to DB
  media/MediaGrid.tsx                # Drag-reorderable photo/video grid
  journey/JourneyForm.tsx            # Title/description form
  journey/LocationForm.tsx           # Add location with map picker
  journey/LocationList.tsx           # Drag-reorderable locations + inline maps
  slideshow/SlideshowPlayer.tsx      # Full-screen auto-advancing slideshow
```

### Editing the app

1. **Add a journey** — click "New Journey" from the nav, fill in title/description
2. **Add locations** — in the edit view, click "Add Location", name it, click the map to pin
3. **Add media** — inside any location, click "Add Photo/Video" to upload
4. **Reorder** — drag locations or media thumbnails by the grip handles
5. **View slideshow** — go to a journey's view page and click "Start Slideshow"

---

## Deploy

### Vercel (recommended)

1. Push the repo to GitHub
2. Import the project in the [Vercel dashboard](https://vercel.com/new)
3. Add these environment variables in Vercel:
   - `NEON_DATABASE_URL` — from [Neon](https://neon.tech) (create a free project)
   - `BLOB_READ_WRITE_TOKEN` — from [Vercel Blob](https://vercel.com/docs/storage/blob) in your project's Storage tab
4. Deploy — Next.js auto-detects the framework

### Other platforms

The app requires:
- Node.js 20+ runtime (uses Next.js Route Handlers and Server Components)
- Postgres database (Neon, AWS RDS, Supabase, etc.)
- File storage with a publicly accessible URL scheme (S3, R2, etc. — swap `@vercel/blob` in `app/api/upload/route.ts`)

For non-Vercel deploys, change the `@neondatabase/serverless` driver to `pg` in `db/index.ts` and update `drizzle.config.ts` accordingly.

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database | PostgreSQL via Drizzle ORM |
| Runtime driver | `@neondatabase/serverless` (Neon) / `pg` (local) |
| Map | Leaflet + OpenStreetMap tiles |
| File storage | Vercel Blob (prod) / local filesystem (dev) |
| Drag & drop | @hello-pangea/dnd |
| Forms | react-hook-form + zod |
