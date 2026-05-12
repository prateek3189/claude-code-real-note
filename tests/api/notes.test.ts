import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/server', () => {
  class MockNextResponse {
    status: number;
    private _body: unknown;
    constructor(body: unknown, init?: { status?: number }) {
      this._body = body;
      this.status = init?.status ?? 200;
    }
    async json() {
      return this._body;
    }
    static json(data: unknown, init?: { status?: number }) {
      return new MockNextResponse(data, init);
    }
  }
  return { NextResponse: MockNextResponse };
});

vi.mock('next/headers', () => ({
  headers: vi.fn(() => Promise.resolve(new Headers())),
}));

vi.mock('@/lib/auth', () => ({
  auth: { api: { getSession: vi.fn() } },
}));

vi.mock('@/lib/notes', () => ({
  createNote: vi.fn(),
  getNotesByUser: vi.fn(),
  getNoteById: vi.fn(),
  updateNote: vi.fn(),
  deleteNote: vi.fn(),
  setNotePublic: vi.fn(),
  getNoteByPublicSlug: vi.fn(),
}));

import { GET as listNotes, POST as createNoteRoute } from '@/app/api/notes/route';
import { DELETE as deleteNoteRoute, PUT as updateNoteRoute } from '@/app/api/notes/[id]/route';
import { POST as shareNoteRoute } from '@/app/api/notes/[id]/share/route';
import { auth } from '@/lib/auth';
import * as notes from '@/lib/notes';

const mockGetSession = vi.mocked(auth.api.getSession);
const mockGetNotesByUser = vi.mocked(notes.getNotesByUser);
const mockCreateNote = vi.mocked(notes.createNote);
const mockGetNoteById = vi.mocked(notes.getNoteById);
const mockUpdateNote = vi.mocked(notes.updateNote);
const mockDeleteNote = vi.mocked(notes.deleteNote);
const mockSetNotePublic = vi.mocked(notes.setNotePublic);

const SESSION = { user: { id: 'user-1' } };
const NOTE_ID = 'note-1';

const mockNote = {
  id: NOTE_ID,
  userId: 'user-1',
  title: 'Test Note',
  contentJson: '{"type":"doc"}',
  isPublic: false,
  publicSlug: null as string | null,
  createdAt: '2024-01-01 00:00:00',
  updatedAt: '2024-01-01 00:00:00',
};

function makeRequest(method: string, body?: unknown): Request {
  return new Request('http://localhost/api/notes', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

function withParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── GET /api/notes ───────────────────────────────────────────────────────────

describe('GET /api/notes', () => {
  it('returns 401 when not authenticated', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockGetSession.mockResolvedValue(null as any);

    const res = await listNotes();

    expect(res.status).toBe(401);
  });

  it('returns the notes list for the authenticated user', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockGetSession.mockResolvedValue(SESSION as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockGetNotesByUser.mockReturnValue([mockNote] as any);

    const res = await listNotes();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual([mockNote]);
    expect(mockGetNotesByUser).toHaveBeenCalledWith(SESSION.user.id);
  });
});

// ─── POST /api/notes ──────────────────────────────────────────────────────────

describe('POST /api/notes', () => {
  it('returns 401 when not authenticated', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockGetSession.mockResolvedValue(null as any);

    const res = await createNoteRoute(makeRequest('POST'));

    expect(res.status).toBe(401);
  });

  it('creates a note with the provided title and returns 201', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockGetSession.mockResolvedValue(SESSION as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockCreateNote.mockReturnValue(mockNote as any);

    const res = await createNoteRoute(makeRequest('POST', { title: 'Test Note' }));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body).toEqual(mockNote);
    expect(mockCreateNote).toHaveBeenCalledWith(SESSION.user.id, {
      title: 'Test Note',
      contentJson: undefined,
    });
  });

  it('creates a note with empty defaults when no body is sent', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockGetSession.mockResolvedValue(SESSION as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockCreateNote.mockReturnValue(mockNote as any);

    const req = new Request('http://localhost/api/notes', { method: 'POST' });
    await createNoteRoute(req);

    expect(mockCreateNote).toHaveBeenCalledWith(SESSION.user.id, {});
  });
});

// ─── PUT /api/notes/:id ───────────────────────────────────────────────────────

describe('PUT /api/notes/:id', () => {
  it('returns 401 when not authenticated', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockGetSession.mockResolvedValue(null as any);

    const res = await updateNoteRoute(makeRequest('PUT'), withParams(NOTE_ID));

    expect(res.status).toBe(401);
  });

  it('returns 404 when the note does not exist', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockGetSession.mockResolvedValue(SESSION as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockUpdateNote.mockReturnValue(undefined as any);

    const res = await updateNoteRoute(makeRequest('PUT', { title: 'x' }), withParams(NOTE_ID));

    expect(res.status).toBe(404);
  });

  it('returns the updated note with 200', async () => {
    const updated = { ...mockNote, title: 'Updated' };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockGetSession.mockResolvedValue(SESSION as any);
    mockUpdateNote.mockReturnValue(updated);

    const res = await updateNoteRoute(
      makeRequest('PUT', { title: 'Updated' }),
      withParams(NOTE_ID),
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.title).toBe('Updated');
    expect(mockUpdateNote).toHaveBeenCalledWith(SESSION.user.id, NOTE_ID, {
      title: 'Updated',
      contentJson: undefined,
    });
  });
});

// ─── DELETE /api/notes/:id ────────────────────────────────────────────────────

describe('DELETE /api/notes/:id', () => {
  it('returns 401 when not authenticated', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockGetSession.mockResolvedValue(null as any);

    const res = await deleteNoteRoute(makeRequest('DELETE'), withParams(NOTE_ID));

    expect(res.status).toBe(401);
  });

  it('returns 404 when the note does not exist', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockGetSession.mockResolvedValue(SESSION as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockGetNoteById.mockReturnValue(undefined as any);

    const res = await deleteNoteRoute(makeRequest('DELETE'), withParams(NOTE_ID));

    expect(res.status).toBe(404);
  });

  it('deletes the note and returns 204', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockGetSession.mockResolvedValue(SESSION as any);
    mockGetNoteById.mockReturnValue(mockNote);
    mockDeleteNote.mockReturnValue(undefined);

    const res = await deleteNoteRoute(makeRequest('DELETE'), withParams(NOTE_ID));

    expect(res.status).toBe(204);
    expect(mockDeleteNote).toHaveBeenCalledWith(SESSION.user.id, NOTE_ID);
  });
});

// ─── POST /api/notes/:id/share ────────────────────────────────────────────────

describe('POST /api/notes/:id/share', () => {
  it('returns 401 when not authenticated', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockGetSession.mockResolvedValue(null as any);

    const res = await shareNoteRoute(makeRequest('POST'), withParams(NOTE_ID));

    expect(res.status).toBe(401);
  });

  it('returns 404 when note not found', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockGetSession.mockResolvedValue(SESSION as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockSetNotePublic.mockReturnValue(undefined as any);

    const res = await shareNoteRoute(makeRequest('POST', { isPublic: true }), withParams(NOTE_ID));

    expect(res.status).toBe(404);
  });

  it('enables sharing and returns share info', async () => {
    const shared = { ...mockNote, isPublic: true, publicSlug: 'slug123' };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockGetSession.mockResolvedValue(SESSION as any);
    mockSetNotePublic.mockReturnValue(shared);

    const res = await shareNoteRoute(makeRequest('POST', { isPublic: true }), withParams(NOTE_ID));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.isPublic).toBe(true);
    expect(body.publicSlug).toBe('slug123');
    expect(mockSetNotePublic).toHaveBeenCalledWith(SESSION.user.id, NOTE_ID, true);
  });

  it('disables sharing and returns cleared slug', async () => {
    const unshared = { ...mockNote, isPublic: false, publicSlug: null };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockGetSession.mockResolvedValue(SESSION as any);
    mockSetNotePublic.mockReturnValue(unshared);

    const res = await shareNoteRoute(makeRequest('POST', { isPublic: false }), withParams(NOTE_ID));
    const body = await res.json();

    expect(body.isPublic).toBe(false);
    expect(body.publicSlug).toBeNull();
    expect(mockSetNotePublic).toHaveBeenCalledWith(SESSION.user.id, NOTE_ID, false);
  });
});
