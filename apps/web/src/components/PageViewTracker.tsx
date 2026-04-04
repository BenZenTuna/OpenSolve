'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

export function PageViewTracker() {
  const pathname = usePathname();
  const lastTrackedRef = useRef<string>('');

  useEffect(() => {
    // Only track the homepage
    if (pathname !== '/') return;

    // Avoid double-tracking the same path (React strict mode, etc.)
    if (lastTrackedRef.current === pathname) return;
    lastTrackedRef.current = pathname;

    // Fire-and-forget to the API
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
    fetch(`${apiUrl}/track/pageview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: pathname }),
    }).catch(() => {});
  }, [pathname]);

  return null;
}
