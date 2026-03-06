'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { apiUrl } from '@/lib/api';

type ConfirmState = 'loading' | 'success' | 'expired' | 'invalid' | 'error';

export default function NewsletterConfirmPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [state, setState] = useState<ConfirmState>(token ? 'loading' : 'invalid');

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    async function confirm() {
      try {
        const res = await fetch(apiUrl(`/newsletter/confirm?token=${encodeURIComponent(token!)}`), {
          credentials: 'include',
        });

        if (cancelled) return;

        if (res.ok) {
          setState('success');
        } else if (res.status === 400) {
          setState('expired');
        } else {
          setState('error');
        }
      } catch {
        if (!cancelled) setState('error');
      }
    }

    confirm();
    return () => { cancelled = true; };
  }, [token]);

  const handleRetry = () => {
    if (!token) return;
    setState('loading');
    fetch(apiUrl(`/newsletter/confirm?token=${encodeURIComponent(token)}`), {
      credentials: 'include',
    })
      .then(res => {
        if (res.ok) setState('success');
        else if (res.status === 400) setState('expired');
        else setState('error');
      })
      .catch(() => setState('error'));
  };

  return (
    <>
      <head>
        <title>Confirm Newsletter Subscription — OpenSolve</title>
        <meta name="robots" content="noindex" />
      </head>
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="max-w-md w-full text-center space-y-6">
          {state === 'loading' && (
            <div className="space-y-4">
              <Loader2 className="w-10 h-10 text-accent animate-spin mx-auto" />
              <p className="text-gray-400 text-sm">Confirming your subscription...</p>
            </div>
          )}

          {state === 'success' && (
            <div className="space-y-4">
              <CheckCircle className="w-14 h-14 text-emerald-400 mx-auto" />
              <h1 className="text-2xl font-display font-bold text-white">You&apos;re subscribed!</h1>
              <p className="text-gray-400">
                Your OpenSolve newsletter subscription is confirmed.
                You&apos;ll receive platform updates and announcements.
              </p>
              <div className="flex flex-col items-center gap-3 pt-2">
                <Link href="/" className="btn-primary">
                  Go to Dashboard
                </Link>
                <Link href="/settings" className="text-sm text-gray-400 hover:text-accent transition-colors">
                  Manage subscription preferences
                </Link>
              </div>
            </div>
          )}

          {state === 'expired' && (
            <div className="space-y-4">
              <AlertCircle className="w-14 h-14 text-amber-400 mx-auto" />
              <h1 className="text-2xl font-display font-bold text-white">This link has expired</h1>
              <p className="text-gray-400">
                Confirmation links expire after 24 hours. You can request a new one
                from your Settings page.
              </p>
              <div className="flex flex-col items-center gap-3 pt-2">
                <Link href="/settings" className="btn-primary">
                  Go to Settings
                </Link>
              </div>
            </div>
          )}

          {state === 'invalid' && (
            <div className="space-y-4">
              <AlertCircle className="w-14 h-14 text-red-400 mx-auto" />
              <h1 className="text-2xl font-display font-bold text-white">Invalid link</h1>
              <p className="text-gray-400">
                This confirmation link is not valid. Please use the link from your email.
              </p>
              <div className="flex flex-col items-center gap-3 pt-2">
                <Link href="/" className="btn-primary">
                  Go to Dashboard
                </Link>
              </div>
            </div>
          )}

          {state === 'error' && (
            <div className="space-y-4">
              <AlertCircle className="w-14 h-14 text-red-400 mx-auto" />
              <h1 className="text-2xl font-display font-bold text-white">Something went wrong</h1>
              <p className="text-gray-400">
                We couldn&apos;t confirm your subscription. Please try again.
              </p>
              <div className="flex flex-col items-center gap-3 pt-2">
                <button onClick={handleRetry} className="btn-primary">
                  Try Again
                </button>
                <Link href="/" className="text-sm text-gray-400 hover:text-accent transition-colors">
                  Go to Dashboard
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
