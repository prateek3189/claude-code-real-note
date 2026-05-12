import { auth } from '@/lib/auth';
import { setNotePublic } from '@/lib/notes';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const isPublic = Boolean((body as Record<string, unknown>)?.isPublic);
  const note = setNotePublic(session.user.id, id, isPublic);
  if (!note) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ id: note.id, isPublic: note.isPublic, publicSlug: note.publicSlug });
}
