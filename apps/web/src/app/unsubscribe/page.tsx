'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { apiUrl } from '@/lib/api';

type UnsubState = 'loading' | 'success' | 'invalid' | 'error';

export default function UnsubscribePage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [state, setState] = useState<UnsubState>(token ? 'loading' : 'invalid');

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    async function unsubscribe() {
      try {
        const res = await fetch(apiUrl(`/newsletter/unsubscribe?token=${encodeURIComponent(token!)}`));

        if (cancelled) return;

        if (res.ok) {
          setState('success');
        } else {
          setState('error');
        }
      } catch {
        if (!cancelled) setState('error');
      }
    }

    unsubscribe();
    return () => { cancelled = true; };
  }, [token]);

  const handleRetry = () => {
    if (!token) return;
    setState('loading');
    fetch(apiUrl(`/newsletter/unsubscribe?token=${encodeURIComponent(token)}`))
      .then(res => {
        if (res.ok) setState('success');
        else setState('error');
      })
      .catch(() => setState('error'));
  };

  return (
    <>
      <head>
        <title>Unsubscribe — OpenSolve</title>
        <meta name="robots" content="noindex" />
      </head>
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="max-w-md w-full text-center space-y-6">
          {state === 'loading' && (
            <div className="space-y-4">
              <Loader2 className="w-10 h-10 text-accent animate-spin mx-auto" />
              <p className="text-gray-400 text-sm">Processing your unsubscribe request...</p>
            </div>
          )}

          {state === 'success' && (
            <div className="space-y-4">
              <CheckCircle className="w-14 h-14 text-emerald-400 mx-auto" />
              <h1 className="text-2xl font-display font-bold text-gray-100">You&apos;ve been unsubscribed</h1>
              <p className="text-gray-400">
                You won&apos;t receive any more newsletter emails from OpenSolve.
                Service notifications about your account may still be sent as required.
              </p>
              <p className="text-xs text-gray-500">
                Changed your mind? You can re-subscribe from your Settings page.
              </p>
              <div className="flex flex-col items-center gap-3 pt-2">
                <Link href="/" className="btn-primary">
                  Go to Home
                </Link>
              </div>
            </div>
          )}

          {state === 'invalid' && (
            <div className="space-y-4">
              <AlertCircle className="w-14 h-14 text-red-400 mx-auto" />
              <h1 className="text-2xl font-display font-bold text-gray-100">Invalid unsubscribe link</h1>
              <p className="text-gray-400">
                This link is not valid. If you want to unsubscribe, you can do so
                from your Settings page or by contacting us.
              </p>
              <div className="flex flex-col items-center gap-3 pt-2">
                <Link href="/" className="btn-primary">
                  Go to Home
                </Link>
              </div>
            </div>
          )}

          {state === 'error' && (
            <div className="space-y-4">
              <AlertCircle className="w-14 h-14 text-red-400 mx-auto" />
              <h1 className="text-2xl font-display font-bold text-gray-100">Something went wrong</h1>
              <p className="text-gray-400">
                We couldn&apos;t process your request. Please try again.
              </p>
              <div className="flex flex-col items-center gap-3 pt-2">
                <button onClick={handleRetry} className="btn-primary">
                  Try Again
                </button>
                <Link href="/" className="text-sm text-gray-400 hover:text-accent transition-colors">
                  Go to Home
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
