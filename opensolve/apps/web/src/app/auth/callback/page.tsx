'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // The backend handles the OAuth callback and sets the cookie,
    // then redirects to the web app root. This page is shown briefly
    // if the user lands here directly.
    const timer = setTimeout(() => {
      router.push('/');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Completing sign in...</p>
        <p className="text-xs text-gray-600 mt-2">You will be redirected shortly.</p>
      </div>
    </div>
  );
}
