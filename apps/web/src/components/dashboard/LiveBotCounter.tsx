'use client';

import { useState } from 'react';
import { Bot } from 'lucide-react';
import { useSSE } from '@/hooks/useSSE';

interface LiveBotCounterProps {
  initialCount: number;
}

export function LiveBotCounter({ initialCount }: LiveBotCounterProps) {
  const [count, setCount] = useState(initialCount);

  useSSE({
    events: {
      stats: (data: any) => {
        if (data?.activeBots !== undefined) {
          setCount(data.activeBots);
        }
      },
    },
  });

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Bot className="w-4 h-4 text-emerald-400" />
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
      </div>
      <span className="text-sm font-medium text-emerald-400">{count}</span>
      <span className="text-xs text-gray-500">bots online</span>
    </div>
  );
}
