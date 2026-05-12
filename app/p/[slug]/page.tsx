import { notFound } from 'next/navigation';
import { getNoteByPublicSlug } from '@/lib/notes';
import { NoteRenderer } from '@/components/NoteRenderer';

export default async function PublicNotePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const note = getNoteByPublicSlug(slug);
  if (!note) notFound();

  return (
    <div className='min-h-screen bg-white dark:bg-gray-950'>
      <main className='mx-auto max-w-3xl px-6 py-16'>
        <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>{note.title}</h1>
        <p className='mt-2 text-sm text-gray-400 dark:text-gray-500'>Shared publicly</p>
        <div className='mt-8'>
          <NoteRenderer contentJson={note.contentJson} />
        </div>
      </main>
    </div>
  );
}
