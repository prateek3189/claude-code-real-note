import { auth } from '@/lib/auth';
import { deleteNote, getNoteById, updateNote } from '@/lib/notes';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const data = {
    title:
      typeof (body as Record<string, unknown>)?.title === 'string'
        ? ((body as Record<string, unknown>).title as string)
        : undefined,
    contentJson:
      typeof (body as Record<string, unknown>)?.contentJson === 'string'
        ? ((body as Record<string, unknown>).contentJson as string)
        : undefined,
  };

  const note = updateNote(session.user.id, id, data);
  if (!note) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(note);
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const note = getNoteById(session.user.id, id);
  if (!note) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  deleteNote(session.user.id, id);
  return new NextResponse(null, { status: 204 });
}
