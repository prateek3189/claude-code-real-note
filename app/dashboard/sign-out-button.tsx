'use client';

import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    await authClient.signOut();
    router.push('/authenticate');
  }

  return (
    <button
      onClick={handleSignOut}
      className='text-sm text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
    >
      Sign out
    </button>
  );
}
