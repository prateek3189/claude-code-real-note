import Link from 'next/link';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getNotesByUser } from '@/lib/notes';
import { SignOutButton } from './sign-out-button';
import { Header } from '@/components/Header';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/authenticate');

  const notes = getNotesByUser(session.user.id);

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-950'>
      <Header>
        <SignOutButton />
      </Header>

      <main className='mx-auto max-w-3xl px-6 py-10'>
        <div className='flex items-center justify-between'>
          <h1 className='text-xl font-semibold text-gray-900 dark:text-white'>My Notes</h1>
          <Link
            href='/notes/new'
            className='rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200'
          >
            New note
          </Link>
        </div>

        {notes.length === 0 ? (
          <div className='mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-24 text-center dark:border-gray-700'>
            <p className='text-gray-400 dark:text-gray-500'>No notes yet.</p>
            <p className='mt-1 text-sm text-gray-400 dark:text-gray-500'>
              Create your first note to get started.
            </p>
          </div>
        ) : (
          <ul className='mt-6 flex flex-col gap-2'>
            {notes.map((note) => (
              <li key={note.id}>
                <Link
                  href={`/notes/${note.id}`}
                  className='flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700 dark:hover:bg-gray-800'
                >
                  <div className='min-w-0'>
                    <p className='truncate font-medium text-gray-900 dark:text-white'>
                      {note.title}
                    </p>
                    <p className='mt-0.5 text-sm text-gray-400 dark:text-gray-500'>
                      {formatDate(note.updatedAt)}
                    </p>
                  </div>
                  {note.isPublic && (
                    <span className='ml-4 shrink-0 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400'>
                      Public
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
