import { auth } from '@/lib/auth';
import { createNote, getNotesByUser } from '@/lib/notes';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  return NextResponse.json(getNotesByUser(session.user.id));
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let data: { title?: string; contentJson?: string } = {};
  try {
    data = await req.json();
  } catch {
    // no body — use defaults
  }

  const note = createNote(session.user.id, data);
  return NextResponse.json(note, { status: 201 });
}
