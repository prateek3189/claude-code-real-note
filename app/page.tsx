import Link from 'next/link';

export default function Home() {
  return (
    <div className='flex min-h-screen flex-col items-center justify-center bg-white px-4 dark:bg-gray-950'>
      <div className='max-w-xl text-center'>
        <h1 className='text-5xl font-bold tracking-tight text-gray-900 dark:text-white'>
          RealNote
        </h1>
        <p className='mt-4 text-lg text-gray-500 dark:text-gray-400'>
          Create, edit, and share rich-text notes — fast and distraction-free.
        </p>
        <div className='mt-8 flex justify-center gap-4'>
          <Link
            href='/authenticate'
            className='rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200'
          >
            Get started
          </Link>
          <Link
            href='/dashboard'
            className='rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
