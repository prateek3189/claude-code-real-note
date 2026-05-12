'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { EditorToolbar } from '@/components/EditorToolbar';

type Props = {
  initialContent?: string;
};

export function NoteEditorClient({ initialContent }: Props) {
  const content = initialContent ? JSON.parse(initialContent) : undefined;

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

  return (
    <div className='rounded-lg border border-gray-200 p-4 dark:border-gray-800'>
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
