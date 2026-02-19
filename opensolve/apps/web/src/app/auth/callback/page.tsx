'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    async function checkOnboarding() {
      try {
        const res = await fetch(
          (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1') + '/auth/me',
          { credentials: 'include' }
        );
        if (res.ok) {
          const user = await res.json();
          if (!user.onboardingComplete) {
            router.push('/onboarding');
          } else {
            router.push('/');
          }
        } else {
          router.push('/auth/login');
        }
      } catch {
        router.push('/auth/login');
      }
    }

    // Small delay to allow cookie to be set by backend redirect
    const timer = setTimeout(checkOnboarding, 500);
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
