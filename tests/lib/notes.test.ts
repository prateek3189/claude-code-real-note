import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
  get: vi.fn(),
  query: vi.fn(),
  run: vi.fn(),
}));

import * as db from '@/lib/db';
import {
  createNote,
  deleteNote,
  getNoteById,
  getNoteByPublicSlug,
  getNotesByUser,
  setNotePublic,
  updateNote,
} from '@/lib/notes';

const mockGet = vi.mocked(db.get);
const mockQuery = vi.mocked(db.query);
const mockRun = vi.mocked(db.run);

const USER_ID = 'user-1';
const NOTE_ID = 'note-1';

const baseRow = {
  id: NOTE_ID,
  user_id: USER_ID,
  title: 'Test Note',
  content_json: '{"type":"doc","content":[]}',
  is_public: 0,
  public_slug: null as string | null,
  created_at: '2024-01-01 00:00:00',
  updated_at: '2024-01-01 00:00:00',
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── createNote ───────────────────────────────────────────────────────────────

describe('createNote', () => {
  it('inserts with default title when none provided', () => {
    mockRun.mockReturnValue(undefined);
    mockGet.mockReturnValue(baseRow);

    createNote(USER_ID);

    const [sql, params] = mockRun.mock.calls[0];
    expect(sql).toContain('INSERT INTO notes');
    expect(params![1]).toBe(USER_ID);
    expect(params![2]).toBe('Untitled note');
  });

  it('inserts with provided title and content', () => {
    mockRun.mockReturnValue(undefined);
    mockGet.mockReturnValue({ ...baseRow, title: 'My Note' });

    createNote(USER_ID, { title: 'My Note', contentJson: '{}' });

    const [, params] = mockRun.mock.calls[0];
    expect(params![2]).toBe('My Note');
    expect(params![3]).toBe('{}');
  });

  it('returns the created note with correct camelCase fields', () => {
    mockRun.mockReturnValue(undefined);
    mockGet.mockReturnValue(baseRow);

    const note = createNote(USER_ID);

    expect(note.id).toBe(NOTE_ID);
    expect(note.userId).toBe(USER_ID);
    expect(note.title).toBe('Test Note');
    expect(note.isPublic).toBe(false);
    expect(note.publicSlug).toBeNull();
    expect(note.contentJson).toBe(baseRow.content_json);
  });
});

// ─── getNotesByUser ───────────────────────────────────────────────────────────

describe('getNotesByUser', () => {
  it('returns empty array when user has no notes', () => {
    mockQuery.mockReturnValue([]);
    expect(getNotesByUser(USER_ID)).toEqual([]);
  });

  it('maps rows to camelCase NoteListItem fields', () => {
    mockQuery.mockReturnValue([baseRow]);

    const [note] = getNotesByUser(USER_ID);

    expect(note.id).toBe(NOTE_ID);
    expect(note.userId).toBe(USER_ID);
    expect(note.title).toBe('Test Note');
    expect(note.isPublic).toBe(false);
    expect(note.publicSlug).toBeNull();
  });

  it('scopes query to the given userId', () => {
    mockQuery.mockReturnValue([]);
    getNotesByUser(USER_ID);
    expect(mockQuery).toHaveBeenCalledWith(expect.any(String), [USER_ID]);
  });

  it('converts is_public=1 to isPublic=true', () => {
    mockQuery.mockReturnValue([{ ...baseRow, is_public: 1, public_slug: 'slug' }]);

    const [note] = getNotesByUser(USER_ID);

    expect(note.isPublic).toBe(true);
    expect(note.publicSlug).toBe('slug');
  });
});

// ─── getNoteById ──────────────────────────────────────────────────────────────

describe('getNoteById', () => {
  it('returns the note when found', () => {
    mockGet.mockReturnValue(baseRow);

    const note = getNoteById(USER_ID, NOTE_ID);

    expect(note).toBeDefined();
    expect(note!.id).toBe(NOTE_ID);
    expect(note!.contentJson).toBe(baseRow.content_json);
  });

  it('returns undefined when note does not exist', () => {
    mockGet.mockReturnValue(undefined);
    expect(getNoteById(USER_ID, 'missing')).toBeUndefined();
  });

  it('passes noteId and userId to enforce per-user isolation', () => {
    mockGet.mockReturnValue(undefined);
    getNoteById(USER_ID, NOTE_ID);
    expect(mockGet).toHaveBeenCalledWith(expect.any(String), [NOTE_ID, USER_ID]);
  });

  it('converts is_public=1 to isPublic=true', () => {
    mockGet.mockReturnValue({ ...baseRow, is_public: 1, public_slug: 'slug123' });

    const note = getNoteById(USER_ID, NOTE_ID);

    expect(note!.isPublic).toBe(true);
    expect(note!.publicSlug).toBe('slug123');
  });
});

// ─── updateNote ───────────────────────────────────────────────────────────────

describe('updateNote', () => {
  it('runs UPDATE and returns the refreshed note', () => {
    mockRun.mockReturnValue(undefined);
    mockGet.mockReturnValue({ ...baseRow, title: 'New Title' });

    const note = updateNote(USER_ID, NOTE_ID, { title: 'New Title' });

    expect(mockRun).toHaveBeenCalledOnce();
    expect(note!.title).toBe('New Title');
  });

  it('returns undefined when note not found', () => {
    mockRun.mockReturnValue(undefined);
    mockGet.mockReturnValue(undefined);

    expect(updateNote(USER_ID, 'missing', { title: 'x' })).toBeUndefined();
  });

  it('passes null for omitted fields so COALESCE keeps existing values', () => {
    mockRun.mockReturnValue(undefined);
    mockGet.mockReturnValue(baseRow);

    updateNote(USER_ID, NOTE_ID, { title: 'Only Title' });

    const [, params] = mockRun.mock.calls[0];
    expect(params![0]).toBe('Only Title');
    expect(params![1]).toBeNull();
  });
});

// ─── deleteNote ───────────────────────────────────────────────────────────────

describe('deleteNote', () => {
  it('executes DELETE with noteId and userId', () => {
    mockRun.mockReturnValue(undefined);

    deleteNote(USER_ID, NOTE_ID);

    expect(mockRun).toHaveBeenCalledWith(expect.stringContaining('DELETE'), [NOTE_ID, USER_ID]);
  });
});

// ─── setNotePublic ────────────────────────────────────────────────────────────

describe('setNotePublic', () => {
  it('returns undefined and skips UPDATE when note not found', () => {
    mockGet.mockReturnValue(undefined);

    expect(setNotePublic(USER_ID, 'missing', true)).toBeUndefined();
    expect(mockRun).not.toHaveBeenCalled();
  });

  it('reuses existing publicSlug when enabling sharing', () => {
    const existing = 'already-has-a-slug';
    mockGet
      .mockReturnValueOnce({ ...baseRow, public_slug: existing })
      .mockReturnValueOnce({ ...baseRow, is_public: 1, public_slug: existing });
    mockRun.mockReturnValue(undefined);

    const note = setNotePublic(USER_ID, NOTE_ID, true);

    const [, params] = mockRun.mock.calls[0];
    expect(params![0]).toBe(existing);
    expect(note!.isPublic).toBe(true);
  });

  it('generates a new slug when enabling sharing without one', () => {
    mockGet
      .mockReturnValueOnce({ ...baseRow, public_slug: null })
      .mockReturnValueOnce({ ...baseRow, is_public: 1, public_slug: 'generated' });
    mockRun.mockReturnValue(undefined);

    setNotePublic(USER_ID, NOTE_ID, true);

    const [, params] = mockRun.mock.calls[0];
    const slug = params![0] as string;
    expect(typeof slug).toBe('string');
    expect(slug.length).toBeGreaterThan(0);
  });

  it('sets is_public=0 and clears slug when disabling sharing', () => {
    mockGet.mockReturnValue({ ...baseRow, is_public: 0, public_slug: null });
    mockRun.mockReturnValue(undefined);

    const note = setNotePublic(USER_ID, NOTE_ID, false);

    const [sql, params] = mockRun.mock.calls[0];
    expect(sql).toContain('is_public = 0');
    expect(params).toEqual([NOTE_ID, USER_ID]);
    expect(note!.isPublic).toBe(false);
  });
});

// ─── getNoteByPublicSlug ──────────────────────────────────────────────────────

describe('getNoteByPublicSlug', () => {
  it('returns the note when the slug exists and is public', () => {
    mockGet.mockReturnValue({ ...baseRow, is_public: 1, public_slug: 'abc123' });

    const note = getNoteByPublicSlug('abc123');

    expect(note!.publicSlug).toBe('abc123');
    expect(note!.isPublic).toBe(true);
  });

  it('returns undefined when slug is not found', () => {
    mockGet.mockReturnValue(undefined);
    expect(getNoteByPublicSlug('missing')).toBeUndefined();
  });

  it('queries with is_public=1 to prevent fetching private notes', () => {
    mockGet.mockReturnValue(undefined);
    getNoteByPublicSlug('test-slug');
    expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('is_public = 1'), ['test-slug']);
  });
});
