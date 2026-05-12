import Link from 'next/link';

export function Header({ children }: { children?: React.ReactNode }) {
  return (
    <header className='border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900'>
      <div className='mx-auto flex max-w-3xl items-center justify-between'>
        <Link
          href='/dashboard'
          className='text-lg font-bold tracking-tight text-gray-900 dark:text-white'
        >
          RealNote
        </Link>
        {children}
      </div>
    </header>
  );
}
