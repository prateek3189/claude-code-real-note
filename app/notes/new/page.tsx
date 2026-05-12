'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { EditorToolbar } from '@/components/EditorToolbar';

export default function NewNotePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [1, 2, 3] } })],
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'min-h-64 outline-none prose prose-gray dark:prose-invert max-w-none',
      },
    },
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const contentJson = JSON.stringify(editor?.getJSON() ?? { type: 'doc', content: [] });
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim() || 'Untitled note', contentJson }),
    });
    if (res.ok) {
      const note = await res.json();
      router.push(`/notes/${note.id}`);
    } else {
      setLoading(false);
    }
  }

  return (
    <div className='min-h-screen bg-white dark:bg-gray-950'>
      <header className='border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900'>
        <div className='mx-auto flex max-w-3xl items-center justify-between'>
          <Link
            href='/dashboard'
            className='text-lg font-bold tracking-tight text-gray-900 dark:text-white'
          >
            RealNote
          </Link>
          <button
            form='new-note-form'
            type='submit'
            disabled={loading}
            className='rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200'
          >
            {loading ? 'Saving…' : 'Save note'}
          </button>
        </div>
      </header>

      <main className='mx-auto max-w-3xl px-6 py-10'>
        <form id='new-note-form' onSubmit={handleSubmit} className='space-y-6'>
          <input
            type='text'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder='Untitled'
            className='w-full bg-transparent text-3xl font-bold text-gray-900 outline-none placeholder:text-gray-300 dark:text-white dark:placeholder:text-gray-700'
          />
          <div className='rounded-lg border border-gray-200 p-4 dark:border-gray-800'>
            <EditorToolbar editor={editor} />
            <EditorContent editor={editor} />
          </div>
        </form>
      </main>
    </div>
  );
}
