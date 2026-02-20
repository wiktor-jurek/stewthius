# Stewthius

This is a Next.js app plus background task scripts used to ingest and analyze TikTok perpetual stew videos.

## App

Run the web app locally:

```bash
npm install
npm run db:migrate
npm run dev
```

## Database (Drizzle + pgvector)

This project uses Drizzle ORM for a shared typed data layer across:
- Next.js server actions
- task scripts in `scripts/tasks`

Run migrations:

```bash
npm run db:migrate
```

`db:migrate` targets `NEW_DATABASE_URL` first, then falls back to `DATABASE_URL`.

Generate new migrations from schema changes:

```bash
npm run db:generate
```

The database must support the `vector` extension (`pgvector`). The migration enables it with:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

## Background Tasks

Node task scripts live in `scripts/tasks` and are designed for non-interactive task runners (like Coolify jobs).

### Available task commands

```bash
npm run task:download-videos
npm run task:analyze-videos
npm run task:ingest
npm run task:pipeline
npm run task:revalidate-cache
npm run task:backfill-transcripts
npm run task:migrate-data
```

- `task:download-videos`: pulls TikTok profile videos via `yt-dlp`, stores files in `data/videos`, and inserts metadata into `videos`.
- `task:analyze-videos`: reads unprocessed videos, asks Gemini for structured analysis + transcript, chunks transcript text, stores embeddings, and marks videos as embedded.
- `task:ingest`: runs download then analyze.
- `task:pipeline`: runs download + analyze + optional cache revalidation in one command.
- `task:revalidate-cache`: calls `/api/revalidate` on your deployed app.
- `task:backfill-transcripts`: re-processes previously processed videos that are missing transcript/embedding records.
- `task:migrate-data`: copies existing core data from `DATABASE_URL` (old DB) to `NEW_DATABASE_URL` (pgvector DB).

## Required Environment Variables

Set these in Coolify for task jobs:

```env
NEW_DATABASE_URL=postgres://...
GEMINI_API_KEY=...
```

For one-time migration from old DB:

```env
DATABASE_URL=postgres://old-db
NEW_DATABASE_URL=postgres://new-pgvector-db
```

Common optional vars:

```env
DATABASE_SSL=false
TIKTOK_PROFILE_URL=https://www.tiktok.com/@zaq.projects?lang=en
VIDEOS_DIR=data/videos
YTDLP_BIN=yt-dlp
YTDLP_FORMAT=best[height<=720]/best[height<=1080]/best
MAX_DOWNLOADS=0
PROCESS_LIMIT=0
GEMINI_MODEL=gemini-2.5-pro
GEMINI_EMBED_MODEL=text-embedding-004
EMBEDDING_DIMENSIONS=768
REVALIDATE_BASE_URL=https://stewthius.com
REVALIDATE_TYPE=all
REVALIDATE_TOKEN=...
PIPELINE_REVALIDATE=true
```

## Coolify Task Suggestions

- Download job: `npm run task:download-videos`
- Analyze job: `npm run task:analyze-videos`
- Ingest only: `npm run task:ingest`
- Full pipeline: `npm run task:pipeline`
- Revalidate only: `npm run task:revalidate-cache`
- Transcript backfill: `npm run task:backfill-transcripts`
- Data migration: `npm run task:migrate-data` (run after `npm run db:migrate`)

## Docker / Coolify

This repo includes a multi-target `Dockerfile` that installs `yt-dlp` and supports both web and task workloads.

- Build web image: `docker build --target web-runner -t stewthius-web .`
- Build task image: `docker build --target task-runner -t stewthius-task .`
- Default task container command: `npm run task:pipeline`
- Coolify scheduled task command example: `npm run task:pipeline`
- If you want ingest only: `npm run task:ingest`
- If you want split jobs, create separate tasks for download/analyze/revalidate commands.

## External Tool Requirement

The downloader uses `yt-dlp` via CLI. The provided Docker image installs it and exposes it via `PATH`.
