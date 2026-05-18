import Link from 'next/link';

export function Header({ children }: { children?: React.ReactNode }) {
  return (
    <header className='border-b border-violet-100 bg-white px-6 py-4 dark:border-violet-900 dark:bg-violet-950'>
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
