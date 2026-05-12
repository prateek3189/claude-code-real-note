'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { EditorToolbar } from '@/components/EditorToolbar';

type Props = {
  noteId: string;
  initialTitle: string;
  initialContent: string;
};

export function NoteEditClient({ noteId, initialTitle, initialContent }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [saving, setSaving] = useState(false);

  const content = (() => {
    try {
      return JSON.parse(initialContent);
    } catch {
      return undefined;
    }
  })();

  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [1, 2, 3] } })],
    content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'min-h-64 outline-none prose prose-gray dark:prose-invert max-w-none',
      },
    },
  });

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/notes/${noteId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim() || 'Untitled note',
        contentJson: JSON.stringify(editor?.getJSON() ?? { type: 'doc', content: [] }),
      }),
    });
    if (res.ok) {
      router.push(`/notes/${noteId}`);
    } else {
      setSaving(false);
    }
  }

  return (
    <div className='space-y-6'>
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
      <div className='flex justify-end'>
        <button
          onClick={handleSave}
          disabled={saving}
          className='rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200'
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}
