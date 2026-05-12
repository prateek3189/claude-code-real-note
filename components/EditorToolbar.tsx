'use client';

import type { Editor } from '@tiptap/react';

type Props = {
  editor: Editor | null;
};

export function EditorToolbar({ editor }: Props) {
  if (!editor) return null;

  const btn = (active: boolean) =>
    `rounded px-2 py-1 text-xs font-medium transition-colors select-none ${
      active
        ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
    }`;

  const sep = <span className='mx-0.5 w-px self-stretch bg-gray-200 dark:bg-gray-700' />;

  return (
    <div className='flex flex-wrap items-center gap-0.5 border-b border-gray-200 pb-2 mb-3 dark:border-gray-700'>
      <button
        type='button'
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={btn(editor.isActive('bold'))}
        title='Bold'
      >
        <strong>B</strong>
      </button>
      <button
        type='button'
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={btn(editor.isActive('italic'))}
        title='Italic'
      >
        <em>I</em>
      </button>

      {sep}

      <button
        type='button'
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={btn(editor.isActive('heading', { level: 1 }))}
        title='Heading 1'
      >
        H1
      </button>
      <button
        type='button'
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={btn(editor.isActive('heading', { level: 2 }))}
        title='Heading 2'
      >
        H2
      </button>
      <button
        type='button'
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={btn(editor.isActive('heading', { level: 3 }))}
        title='Heading 3'
      >
        H3
      </button>
      <button
        type='button'
        onClick={() => editor.chain().focus().setParagraph().run()}
        className={btn(editor.isActive('paragraph') && !editor.isActive('heading'))}
        title='Normal text'
      >
        ¶
      </button>

      {sep}

      <button
        type='button'
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={btn(editor.isActive('bulletList'))}
        title='Bullet list'
      >
        ≡
      </button>

      {sep}

      <button
        type='button'
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={btn(editor.isActive('code'))}
        title='Inline code'
      >
        {'<>'}
      </button>
      <button
        type='button'
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={btn(editor.isActive('codeBlock'))}
        title='Code block'
      >
        {'</>'}
      </button>

      {sep}

      <button
        type='button'
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        className={btn(false)}
        title='Horizontal rule'
      >
        —
      </button>
    </div>
  );
}
