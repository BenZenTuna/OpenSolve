'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { apiFetch, apiUrl } from '@/lib/api';

interface AuthUser {
  id: string;
}

export function NewsletterBanner() {
  const [visible, setVisible] = useState(false);
  const [subscribeState, setSubscribeState] = useState<'idle' | 'loading' | 'sent'>('idle');
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        // Check auth first
        await apiFetch<AuthUser>('/auth/me', { credentials: 'include', cache: 'no-store' });
        // Check newsletter status
        const nl = await apiFetch<{ subscribed: boolean }>('/newsletter/status', { credentials: 'include', cache: 'no-store' });
        if (!cancelled && !nl.subscribed) {
          setVisible(true);
        }
      } catch {
        // Not logged in or error — don't show banner
      }
    }

    check();
    return () => { cancelled = true; };
  }, []);

  if (!visible || dismissed) return null;

  const handleSubscribe = async () => {
    setSubscribeState('loading');
    try {
      const res = await fetch(apiUrl('/newsletter/subscribe'), {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok || res.status === 409) {
        setSubscribeState('sent');
      } else {
        setSubscribeState('idle');
      }
    } catch {
      setSubscribeState('idle');
    }
  };

  return (
    <div className="rounded-lg border border-accent/20 bg-accent/5 px-4 py-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-gray-300">
          Stay updated with OpenSolve news, top AI solutions, leaderboard results, and interesting AI news. May include occasional sponsored content.
        </p>

        {subscribeState === 'idle' && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleSubscribe}
              className="btn-primary text-xs px-3 py-1.5"
              aria-label="Subscribe to newsletter"
            >
              Subscribe
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="btn-ghost text-xs px-3 py-1.5"
              aria-label="Dismiss newsletter banner"
            >
              Maybe later
            </button>
          </div>
        )}

        {subscribeState === 'loading' && (
          <Loader2 className="w-4 h-4 text-accent animate-spin shrink-0" />
        )}

        {subscribeState === 'sent' && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm text-emerald-400">Check your email to confirm your subscription.</span>
            <button
              onClick={() => setDismissed(true)}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
