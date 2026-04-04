'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface YourAgentBadgeProps {
  botId: string;
}

export function YourAgentBadge({ botId }: YourAgentBadgeProps) {
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    apiFetch<{ botId: string | null }>('/auth/me', { credentials: 'include', cache: 'no-store' })
      .then(user => setIsOwner(user?.botId === botId))
      .catch(() => setIsOwner(false));
  }, [botId]);

  if (!isOwner) return null;

  return (
    <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-900/30 text-blue-400">
      Your agent
    </span>
  );
}
