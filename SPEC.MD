# Technical Specification – Note Taking Web App

## 1. Overview

A web application where authenticated users can create, view, edit, delete, and publicly share rich-text notes. Notes are created with TipTap, stored as JSON in a SQLite database, and rendered in the browser with formatting.

### Core Features

- User authentication (sign up, login, logout) via better-auth
- Authenticated note management (CRUD)
- Rich text editor using TipTap with:
  - Bold, Italic
  - Heading levels (H1–H3) + normal text
  - Inline code + code blocks
  - Bullet lists
  - Horizontal rules
- Public sharing of notes via a public URL (toggle on/off)

### Tech Stack

| Layer    | Technology                              |
| -------- | --------------------------------------- |
| Runtime  | Bun                                     |
| Frontend | Next.js (App Router) + TypeScript       |
| Styling  | TailwindCSS                             |
| Database | SQLite via `bun:sqlite`                 |
| Auth     | better-auth                             |

---

## 2. Architecture

### 2.1 High-Level Architecture

- **Frontend & Backend:** Next.js (App Router)
  - Server components for data fetching
  - Client components for TipTap editor and interactive UI
  - Route Handlers (`app/api/.../route.ts`) for JSON APIs
- **Runtime:** Bun (for dev & production)
- **Database:** Single SQLite file (`app.db`) accessed via `bun:sqlite`
- **Auth:** better-auth integrated into Next.js (middleware + server helpers)

### 2.2 Application Layers

**Presentation layer**
- Next.js pages and components
- TailwindCSS for styling
- TipTap editor component

**API layer**
- REST-like JSON endpoints for notes CRUD & sharing

**Data access layer**
- Raw SQL queries executed via `bun:sqlite`
- A small helper module for DB access

---

## 3. Functional Requirements

### 3.1 Authentication

Users can:
- Register (email + password, minimum validation)
- Log in / log out

Authentication state is accessible on server (for SSR) and on client (for protected UI).

Unauthenticated users:
- Can access public shared note URLs (read-only)
- Cannot access dashboard or personal notes

### 3.2 Notes Management (Authenticated)

**Create a new note:**
- Default title: "Untitled note"
- Default empty TipTap document

**View a list of own notes:**
- Show title, last updated at, shared status

**View a single note:**
- Load editor with stored TipTap JSON document

**Update note:**
- Change title
- Change content (TipTap JSON)
- Auto-update `updated_at`

**Delete note:**
- Hard delete

### 3.3 Note Sharing

Users can toggle note "public sharing":

**When enabled:**
- Note gets a unique public slug (e.g. `abcdef1234`)
- Accessible via `/p/{slug}` for anonymous users

**When disabled:**
- Public URL returns 404 / "Note not found"

**Public page rendering:**
- Reads note from DB by `public_slug`
- Shows title and content in read-only mode
- No editing or owner information necessary

---

## 4. Non-Functional Requirements

| Concern         | Requirement                                                                 |
| --------------- | --------------------------------------------------------------------------- |
| Performance     | Notes list & note view load under ~300 ms for typical DB sizes              |
| Security        | All note operations scoped to `user_id`; public notes are read-only        |
| Reliability     | Graceful handling of DB errors                                              |
| Maintainability | Type-safe APIs and DB types; modularized DB and auth helpers                |
| UX              | Simple, minimal UI with keyboard-friendly editor                            |

---

## 5. Data Model & Database Schema (SQLite)

### 5.1 better-auth Integration

better-auth is configured with Bun's built-in SQLite module:

```ts
// lib/auth.ts
import { betterAuth } from "better-auth";
import { Database } from "bun:sqlite";

export const auth = betterAuth({
  database: new Database("app.db"),
});
```

> **Note:** When running better-auth CLI commands, always use the `--bun` flag to avoid type errors from the `bun:sqlite` module:
>
> ```bash
> bunx --bun auth@latest generate   # generate schema SQL
> bunx --bun auth@latest migrate    # apply schema to DB
> ```

better-auth automatically manages its own tables (`user`, `session`, `account`, `verification`). **Do not create these manually** — use the CLI to generate and migrate the schema.

### 5.2 better-auth Managed Tables

The following tables are generated and owned by better-auth. Their exact DDL is produced by `bunx --bun auth@latest generate`. The schemas below are for reference only.

#### `user`

| Column          | Type    | Notes                          |
| --------------- | ------- | ------------------------------ |
| `id`            | TEXT    | Primary key                    |
| `name`          | TEXT    | Display name                   |
| `email`         | TEXT    | Unique, used for login         |
| `emailVerified` | INTEGER | `0` or `1`                     |
| `image`         | TEXT    | Avatar URL (optional)          |
| `createdAt`     | TEXT    | ISO timestamp                  |
| `updatedAt`     | TEXT    | ISO timestamp                  |

#### `session`

| Column      | Type | Notes                          |
| ----------- | ---- | ------------------------------ |
| `id`        | TEXT | Primary key                    |
| `userId`    | TEXT | FK → `user.id`                 |
| `token`     | TEXT | Unique session token           |
| `expiresAt` | TEXT | ISO timestamp                  |
| `ipAddress` | TEXT | Optional                       |
| `userAgent` | TEXT | Optional                       |
| `createdAt` | TEXT | ISO timestamp                  |
| `updatedAt` | TEXT | ISO timestamp                  |

#### `account`

| Column                 | Type | Notes                                                          |
| ---------------------- | ---- | -------------------------------------------------------------- |
| `id`                   | TEXT | Primary key                                                    |
| `userId`               | TEXT | FK → `user.id`                                                 |
| `accountId`            | TEXT | Provider account ID (or `userId` for credential accounts)     |
| `providerId`           | TEXT | e.g. `"credential"`, `"google"`, `"github"`                   |
| `accessToken`          | TEXT | Optional                                                       |
| `refreshToken`         | TEXT | Optional                                                       |
| `accessTokenExpiresAt` | TEXT | Optional                                                       |
| `refreshTokenExpiresAt`| TEXT | Optional                                                       |
| `scope`                | TEXT | Optional                                                       |
| `idToken`              | TEXT | Optional                                                       |
| `password`             | TEXT | Hashed password for email/password auth (optional)            |
| `createdAt`            | TEXT | ISO timestamp                                                  |
| `updatedAt`            | TEXT | ISO timestamp                                                  |

#### `verification`

| Column       | Type | Notes                     |
| ------------ | ---- | ------------------------- |
| `id`         | TEXT | Primary key               |
| `identifier` | TEXT | Identifies the request    |
| `value`      | TEXT | Value to verify           |
| `expiresAt`  | TEXT | ISO timestamp             |
| `createdAt`  | TEXT | ISO timestamp             |
| `updatedAt`  | TEXT | ISO timestamp             |

### 5.3 Application Table: `notes`

This table is created and managed by the application (not better-auth).

```sql
CREATE TABLE notes (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL,
  title        TEXT NOT NULL,
  content_json TEXT NOT NULL,
  is_public    INTEGER NOT NULL DEFAULT 0,
  public_slug  TEXT UNIQUE,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES user(id)
);
```

| Column        | Type    | Notes                                         |
| ------------- | ------- | --------------------------------------------- |
| `id`          | TEXT    | Primary key (nanoid)                          |
| `user_id`     | TEXT    | FK → `user.id`                               |
| `title`       | TEXT    | Note title                                    |
| `content_json`| TEXT    | Stringified TipTap JSON document              |
| `is_public`   | INTEGER | `0` = private, `1` = public                   |
| `public_slug` | TEXT    | Unique slug for public URL; `NULL` if private |
| `created_at`  | TEXT    | ISO timestamp                                 |
| `updated_at`  | TEXT    | ISO timestamp                                 |

### 5.4 Indexes

```sql
CREATE INDEX idx_notes_user_id    ON notes(user_id);
CREATE INDEX idx_notes_public_slug ON notes(public_slug);
CREATE INDEX idx_notes_is_public  ON notes(is_public);
```

---

## 6. Backend: DB & API Layer

### 6.1 Database Access Module

**File:** `lib/db.ts`

- Initialize `bun:sqlite` client with DB file (`app.db`)
- Export helper functions:
  - `getDb()` – returns singleton DB connection
  - `query<T>(sql, params?): T[]`
  - `get<T>(sql, params?): T | undefined`
  - `run(sql, params?)`

### 6.2 Note Repository Functions

**File:** `lib/notes.ts`

**TypeScript types:**

```typescript
export type Note = {
  id: string;
  userId: string;
  title: string;
  contentJson: string; // stringified TipTap doc
  isPublic: boolean;
  publicSlug: string | null;
  createdAt: string;
  updatedAt: string;
};
```

**Repository functions:**

| Function | Description |
| -------- | ----------- |
| `createNote(userId, data)` | Creates note with defaults |
| `getNoteById(userId, noteId)` | Fetches single note scoped to user |
| `getNotesByUser(userId)` | Lists all notes for user |
| `updateNote(userId, noteId, data)` | Updates title and/or content |
| `deleteNote(userId, noteId)` | Hard deletes note |
| `setNotePublic(userId, noteId, isPublic)` | Toggles sharing; generates/clears slug |
| `getNoteByPublicSlug(slug)` | Fetches public note by slug (no auth) |

Each function enforces `user_id = ?` in SQL to prevent cross-user access.

---

## 7. API Design (Next.js Route Handlers)

Base path: `/api/notes`

### 7.1 Authentication

All `/api/notes` handlers (except public read) must:
- Call a server helper (e.g. `auth.api.getSession`) to verify the session
- Return `401` if not authenticated

### 7.2 Endpoints

#### `GET /api/notes`

List notes for current user. Omits `contentJson` for performance.

**Response 200:**
```json
[
  {
    "id": "note-id",
    "title": "My Note",
    "isPublic": true,
    "updatedAt": "2025-01-01T12:00:00Z"
  }
]
```

---

#### `POST /api/notes`

Create a new note.

**Request body:**
```json
{
  "title": "Optional title",
  "contentJson": { "type": "doc" }
}
```

Defaults: title = `"Untitled note"`, content = empty TipTap document.

**Response:** `201` with created note.

---

#### `GET /api/notes/:id`

Get single note owned by current user.

**Response:**
- `200` with full note including `contentJson`
- `404` if not found or not owned by user

---

#### `PUT /api/notes/:id`

Update note title and/or content.

**Request body:**
```json
{
  "title": "New title",
  "contentJson": { "type": "doc" }
}
```

**Response:** `200` with updated note, `404` if not found.

---

#### `DELETE /api/notes/:id`

Delete note.

**Response:** `204` on success, `404` if not found.

---

#### `POST /api/notes/:id/share`

Toggle public sharing.

**Request body:**
```json
{ "isPublic": true }
```

**Behavior:**
- `isPublic = true` + no existing slug → generate new slug via `nanoid()`
- `isPublic = false` → set `is_public = 0`, `public_slug = NULL`

**Response 200:**
```json
{
  "id": "note-id",
  "isPublic": true,
  "publicSlug": "abcdef1234"
}
```

---

### 7.3 Public Note Endpoint

#### `GET /api/public-notes/:slug`

Read-only access. No auth required.

**Response 200:**
```json
{
  "title": "Public note",
  "contentJson": { "type": "doc" }
}
```

- `404` if slug not found or `is_public = 0`

> Alternatively, resolve directly in the `/p/[slug]` server component and skip this route handler.

---

## 8. Frontend – Pages & Components

### 8.1 Routes

| Route            | Description                                           |
| ---------------- | ----------------------------------------------------- |
| `/`              | Landing page with login/sign-up CTA                   |
| `/dashboard`     | Authenticated notes list + "Create note" button       |
| `/notes/[id]`    | TipTap editor, title field, share toggle, delete      |
| `/p/[slug]`      | Public read-only note page                            |
| `/(auth)/login`  | Login page (if better-auth doesn't provide own UI)    |
| `/(auth)/register` | Registration page                                   |

### 8.2 Layout & Navigation

**`app/layout.tsx`** — Global layout:
- Header with app name
- Login/logout/account controls
- Theme toggle

### 8.3 Components

| Component                  | Description                                                        |
| -------------------------- | ------------------------------------------------------------------ |
| `components/NoteList.tsx`  | Renders list of notes linking to `/notes/[id]`                     |
| `components/NoteEditor.tsx`| TipTap editor; calls `onChange` on update                          |
| `components/ShareToggle.tsx` | Toggle for `isPublic`; shows public URL when enabled             |
| `components/DeleteNoteButton.tsx` | Confirms and calls DELETE API                             |
| `components/PublicNoteViewer.tsx` | Read-only TipTap content (`editable: false`)              |

---

## 9. TipTap Integration

### 9.1 Extensions

| Extension           | Purpose                                      |
| ------------------- | -------------------------------------------- |
| `StarterKit`        | Paragraphs, headings, bold, italic, lists, HR |
| `Code`              | Inline code                                  |
| `CodeBlock`         | Code block snippets                          |

**Editor setup:**

```typescript
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Code from '@tiptap/extension-code';
import CodeBlock from '@tiptap/extension-code-block';

const editor = useEditor({
  extensions: [
    StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
    Code,
    CodeBlock,
  ],
  content: initialContentJson,
  onUpdate: ({ editor }) => onChange(editor.getJSON()),
});
```

Content is stored as `JSON.stringify(json)` and parsed back with `JSON.parse` when loading.

### 9.2 Toolbar

Each button calls the corresponding TipTap chain (e.g. `editor.chain().focus().toggleBold().run()`):

- Bold, Italic
- H1, H2, H3, Paragraph
- Bullet list
- Inline code
- Code block
- Horizontal rule

---

## 10. Styling (TailwindCSS)

- Configure in `tailwind.config.ts`
- Minimal design: neutral background, card-like note containers
- Use `@tailwindcss/typography` for prose styling in read-only note views

---

## 11. Security Considerations

| Concern           | Measure                                                                       |
| ----------------- | ----------------------------------------------------------------------------- |
| Auth enforcement  | `/dashboard` and `/notes/[id]` check auth on server; API routes verify session |
| Authorization     | Every note query filters by `user_id`                                         |
| Public slugs      | Use 16+ character random slugs (nanoid) to prevent enumeration                |
| XSS               | Store TipTap JSON, not raw HTML; render only via TipTap (no `dangerouslySetInnerHTML`) |
| Rate limiting     | Optional: apply per-IP or per-user limits on API routes                       |

---

## 12. Development Workflow

1. Initialize Next.js app with Bun & TypeScript
2. Set up TailwindCSS
3. Integrate better-auth with `bun:sqlite`; run `bunx --bun auth@latest generate` to produce auth schema
4. Apply auth schema migration: `bunx --bun auth@latest migrate`
5. Create `notes` table and indexes manually (see §5.3–5.4)
6. Build DB helpers (`lib/db.ts`) and note repository (`lib/notes.ts`)
7. Implement `/api/notes` and sharing API endpoints
8. Build dashboard and note editor pages
9. Integrate TipTap editor and toolbar
10. Implement public note pages `/p/[slug]`
11. Add polish: loading states, toast messages, error handling
