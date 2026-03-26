'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, User } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface MeResponse {
  id: string;
  username: string | null;
  problemCount: number;
}

export function MyPostsBar() {
  const [user, setUser] = useState<MeResponse | null>(null);

  useEffect(() => {
    apiFetch<MeResponse>('/auth/me', { credentials: 'include', cache: 'no-store' })
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  if (!user) return null;

  const displayName = user.username || 'You';

  return (
    <div className="flex items-center justify-between bg-gray-800/40 rounded-lg px-4 py-2.5 mb-4">
      <div className="flex items-center gap-2.5 text-sm min-w-0">
        <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-blue-900/30 text-blue-400 shrink-0">
          <User size={10} />
        </span>
        <span className="text-gray-300 truncate">{displayName}</span>
        <span className="text-gray-600">&middot;</span>
        <span className="text-gray-500">{user.problemCount} post{user.problemCount !== 1 ? 's' : ''}</span>
      </div>
      <Link
        href={`/users/${user.id}`}
        className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition-colors shrink-0 ml-3"
      >
        View your profile
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
