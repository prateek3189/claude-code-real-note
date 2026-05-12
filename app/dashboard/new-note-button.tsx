'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function NewNoteButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const res = await fetch('/api/notes', { method: 'POST' });
    const note = await res.json();
    router.push(`/notes/${note.id}`);
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className='rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200'
    >
      {loading ? 'Creating…' : 'New note'}
    </button>
  );
}
