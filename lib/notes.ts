import { randomUUID, randomBytes } from 'node:crypto';
import { get, query, run } from './db';

export type Note = {
  id: string;
  userId: string;
  title: string;
  contentJson: string;
  isPublic: boolean;
  publicSlug: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NoteListItem = Omit<Note, 'contentJson'>;

type NoteRow = {
  id: string;
  user_id: string;
  title: string;
  content_json: string;
  is_public: number;
  public_slug: string | null;
  created_at: string;
  updated_at: string;
};

const EMPTY_DOC = JSON.stringify({ type: 'doc', content: [] });

function toNote(row: NoteRow): Note {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    contentJson: row.content_json,
    isPublic: row.is_public === 1,
    publicSlug: row.public_slug,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createNote(userId: string, data?: { title?: string; contentJson?: string }): Note {
  const id = randomUUID();
  run(`INSERT INTO notes (id, user_id, title, content_json) VALUES (?, ?, ?, ?)`, [
    id,
    userId,
    data?.title || 'Untitled note',
    data?.contentJson || EMPTY_DOC,
  ]);
  return toNote(get<NoteRow>(`SELECT * FROM notes WHERE id = ?`, [id])!);
}

export function getNotesByUser(userId: string): NoteListItem[] {
  return query<NoteRow>(
    `SELECT id, user_id, title, is_public, public_slug, created_at, updated_at
     FROM notes WHERE user_id = ? ORDER BY updated_at DESC`,
    [userId],
  ).map((row) => ({
    id: row.id,
    userId: row.user_id,
    title: row.title,
    isPublic: row.is_public === 1,
    publicSlug: row.public_slug,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export function getNoteById(userId: string, noteId: string): Note | undefined {
  const row = get<NoteRow>(`SELECT * FROM notes WHERE id = ? AND user_id = ?`, [noteId, userId]);
  return row ? toNote(row) : undefined;
}

export function updateNote(
  userId: string,
  noteId: string,
  data: { title?: string; contentJson?: string },
): Note | undefined {
  run(
    `UPDATE notes SET title = COALESCE(?, title), content_json = COALESCE(?, content_json),
     updated_at = datetime('now') WHERE id = ? AND user_id = ?`,
    [data.title ?? null, data.contentJson ?? null, noteId, userId],
  );
  return getNoteById(userId, noteId);
}

export function deleteNote(userId: string, noteId: string): void {
  run(`DELETE FROM notes WHERE id = ? AND user_id = ?`, [noteId, userId]);
}

export function setNotePublic(userId: string, noteId: string, isPublic: boolean): Note | undefined {
  if (isPublic) {
    const existing = getNoteById(userId, noteId);
    if (!existing) return undefined;
    const slug = existing.publicSlug ?? randomBytes(8).toString('hex');
    run(
      `UPDATE notes SET is_public = 1, public_slug = ?, updated_at = datetime('now')
       WHERE id = ? AND user_id = ?`,
      [slug, noteId, userId],
    );
  } else {
    run(
      `UPDATE notes SET is_public = 0, public_slug = NULL, updated_at = datetime('now')
       WHERE id = ? AND user_id = ?`,
      [noteId, userId],
    );
  }
  return getNoteById(userId, noteId);
}

export function getNoteByPublicSlug(slug: string): Note | undefined {
  const row = get<NoteRow>(`SELECT * FROM notes WHERE public_slug = ? AND is_public = 1`, [slug]);
  return row ? toNote(row) : undefined;
}
