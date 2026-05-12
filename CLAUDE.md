# CLAUDE.md

We're building the app described in @SPEC.MD. Read that file for general architectural tasks or to double-check the exact database structure, tech stack or application architecture.

Keep your replies extremely concise and focus on conveying the key information. No unnecessary fluff, no long code snippets.

Whenever working with any third-party library or something similar, you MUST look up the official documentation to ensure that you're working with up-to-date information.

Use the DocsExplorer subagent for efficient documentation lookup.

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
bun dev          # start dev server
bun run build    # production build
bun run lint     # ESLint
```

**Always use Bun** (`bun`, `bunx`) — not npm/npx — as the runtime.

## Database Setup

better-auth manages its own tables. Never create them manually:

```bash
bunx --bun auth@latest generate   # generate auth schema SQL
bunx --bun auth@latest migrate    # apply to app.db
```

The `notes` table is application-managed (see `SPEC.MD §5.3`).

Required env vars (copy from `.env.example`):

- `BETTER_AUTH_SECRET` — must be ≥32 chars
- `DB_PATH` — path to SQLite file (e.g. `data/app.db`)

## Architecture

**Stack:** Next.js 16 App Router · TypeScript · TailwindCSS 4 · SQLite (`bun:sqlite`) · better-auth · TipTap

**Key conventions:**

- Server components fetch data directly; client components handle TipTap and interactive UI
- Route handlers live at `app/api/.../route.ts`
- DB access goes through `lib/db.ts` (singleton `bun:sqlite` connection)
- Note repository functions in `lib/notes.ts` — every query filters by `user_id` to prevent cross-user access

**Routes:**

| Route              | Purpose                         |
| ------------------ | ------------------------------- |
| `/`                | Landing page                    |
| `/dashboard`       | Authenticated notes list        |
| `/notes/[id]`      | TipTap editor with share/delete |
| `/p/[slug]`        | Public read-only note           |
| `/(auth)/login`    | Login                           |
| `/(auth)/register` | Registration                    |

**API base:** `/api/notes` — all endpoints require session auth except `GET /api/public-notes/:slug`

**Note sharing:** toggling public generates a nanoid slug (16+ chars) stored as `public_slug`; disabling sets it to NULL.

**TipTap:** content stored as `JSON.stringify(editor.getJSON())` in `content_json` column; never stored as raw HTML. Editor uses `StarterKit` + `Code` + `CodeBlock` extensions.
