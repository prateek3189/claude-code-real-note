import { headers } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getNoteById } from '@/lib/notes';
import { Header } from '@/components/Header';
import { NoteRenderer } from '@/components/NoteRenderer';
import { ShareToggle } from '@/components/ShareToggle';
import { DeleteNoteButton } from './DeleteNoteButton';

export default async function NotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/authenticate');

  const note = getNoteById(session.user.id, id);
  if (!note) notFound();

  return (
    <div className='min-h-screen bg-white dark:bg-gray-950'>
      <Header>
        <div className='flex gap-3'>
          <Link
            href={`/notes/${note.id}/edit`}
            className='rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'
          >
            Edit
          </Link>
          <DeleteNoteButton noteId={note.id} />
        </div>
      </Header>

      <main className='mx-auto max-w-3xl px-6 py-10'>
        <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>{note.title}</h1>
        <div className='mt-4'>
          <ShareToggle
            noteId={note.id}
            initialIsPublic={note.isPublic}
            initialPublicSlug={note.publicSlug}
          />
        </div>
        <div className='mt-8'>
          <NoteRenderer contentJson={note.contentJson} />
        </div>
      </main>
    </div>
  );
}
