'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export function DeleteNoteButton({ noteId }: { noteId: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/notes/${noteId}`, { method: 'DELETE' });
    if (res.ok) {
      router.push('/dashboard');
    } else {
      setDeleting(false);
    }
  }

  return (
    <>
      <button
        onClick={() => dialogRef.current?.showModal()}
        className='rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950'
      >
        Delete
      </button>

      <dialog
        ref={dialogRef}
        className='rounded-xl border border-gray-200 bg-white p-6 shadow-xl backdrop:bg-black/40 dark:border-gray-700 dark:bg-gray-900'
      >
        <h2 className='text-lg font-semibold text-gray-900 dark:text-white'>Delete note?</h2>
        <p className='mt-2 text-sm text-gray-500 dark:text-gray-400'>
          This action cannot be undone.
        </p>
        <div className='mt-6 flex justify-end gap-3'>
          <button
            onClick={() => dialogRef.current?.close()}
            className='rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className='rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50'
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </dialog>
    </>
  );
}
