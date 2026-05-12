'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { authClient } from '@/lib/auth-client';

const inputCls =
  'mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus-visible:border-gray-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 dark:focus-visible:border-gray-400 dark:focus-visible:ring-gray-400';

const labelCls = 'block text-sm font-medium text-gray-700 dark:text-gray-300';

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') === 'register' ? 'register' : 'login';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'register') {
      await authClient.signUp.email(
        { name, email, password },
        {
          onSuccess: () => router.push('/dashboard'),
          onError: (ctx) => setError(ctx.error.message),
        },
      );
    } else {
      await authClient.signIn.email(
        { email, password },
        {
          onSuccess: () => router.push('/dashboard'),
          onError: (ctx) => setError(ctx.error.message),
        },
      );
    }

    setLoading(false);
  }

  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950'>
      <div className='w-full max-w-sm space-y-6 rounded-xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight text-gray-900 dark:text-white'>
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </h1>
          <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
            {mode === 'login' ? 'Welcome back.' : 'Start taking notes today.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className='space-y-4'>
          {mode === 'register' && (
            <div>
              <label className={labelCls} htmlFor='name'>
                Name
              </label>
              <input
                id='name'
                type='text'
                autoComplete='name'
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='Your name'
                className={inputCls}
              />
            </div>
          )}

          <div>
            <label className={labelCls} htmlFor='email'>
              Email
            </label>
            <input
              id='email'
              type='email'
              autoComplete='email'
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder='you@example.com'
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls} htmlFor='password'>
              Password
            </label>
            <input
              id='password'
              type='password'
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder='••••••••'
              className={inputCls}
            />
          </div>

          {error && <p className='text-sm text-red-600 dark:text-red-400'>{error}</p>}

          <button
            type='submit'
            disabled={loading}
            className='w-full rounded-lg bg-gray-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200'
          >
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className='text-center text-sm text-gray-500 dark:text-gray-400'>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <Link
            href={mode === 'login' ? '/authenticate?mode=register' : '/authenticate'}
            className='font-medium text-gray-900 underline underline-offset-2 transition-colors hover:text-gray-600 dark:text-white dark:hover:text-gray-300'
          >
            {mode === 'login' ? 'Create one' : 'Sign in'}
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function AuthenticatePage() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  );
}
