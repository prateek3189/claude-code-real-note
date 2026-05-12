import { headers } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { getNoteById } from '@/lib/notes';
import { Header } from '@/components/Header';
import { ShareToggle } from '@/components/ShareToggle';
import { NoteEditClient } from './NoteEditClient';

export default async function EditNotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/authenticate');

  const note = getNoteById(session.user.id, id);
  if (!note) notFound();

  return (
    <div className='min-h-screen bg-white dark:bg-gray-950'>
      <Header>
        <Link
          href={`/notes/${id}`}
          className='text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
        >
          ← Cancel
        </Link>
      </Header>

      <main className='mx-auto max-w-3xl px-6 py-10'>
        <NoteEditClient noteId={id} initialTitle={note.title} initialContent={note.contentJson} />
        <div className='mt-6 rounded-lg border border-gray-200 p-4 dark:border-gray-800'>
          <ShareToggle
            noteId={id}
            initialIsPublic={note.isPublic}
            initialPublicSlug={note.publicSlug}
          />
        </div>
      </main>
    </div>
  );
}
