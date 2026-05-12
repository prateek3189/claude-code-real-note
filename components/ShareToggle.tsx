'use client';

import { useState } from 'react';

type Props = {
  noteId: string;
  initialIsPublic: boolean;
  initialPublicSlug: string | null;
};

export function ShareToggle({ noteId, initialIsPublic, initialPublicSlug }: Props) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [publicSlug, setPublicSlug] = useState(initialPublicSlug);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const publicPath = publicSlug ? `/p/${publicSlug}` : null;

  async function toggle() {
    setLoading(true);
    const res = await fetch(`/api/notes/${noteId}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublic: !isPublic }),
    });
    if (res.ok) {
      const data = await res.json();
      setIsPublic(data.isPublic);
      setPublicSlug(data.publicSlug);
    }
    setLoading(false);
  }

  async function copyLink() {
    if (!publicPath) return;
    await navigator.clipboard.writeText(`${window.location.origin}${publicPath}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className='flex flex-col gap-2'>
      <div className='flex items-center gap-3'>
        <button
          onClick={toggle}
          disabled={loading}
          role='switch'
          aria-checked={isPublic}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:opacity-50 dark:focus:ring-white dark:focus:ring-offset-gray-950 ${
            isPublic ? 'bg-gray-900 dark:bg-white' : 'bg-gray-200 dark:bg-gray-700'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform dark:bg-gray-900 ${
              isPublic ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
        <span className='text-sm text-gray-600 dark:text-gray-400'>
          {isPublic ? 'Public sharing on' : 'Public sharing off'}
        </span>
      </div>

      {isPublic && publicPath && (
        <div className='flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-800 dark:bg-gray-900'>
          <span className='min-w-0 flex-1 truncate text-xs text-gray-500 dark:text-gray-400'>
            {publicPath}
          </span>
          <button
            onClick={copyLink}
            className='shrink-0 text-xs font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white'
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}
    </div>
  );
}
