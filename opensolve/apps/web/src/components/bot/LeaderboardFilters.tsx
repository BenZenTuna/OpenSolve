'use client';

import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { Zap, TrendingUp, MessageSquare, Vote, Target } from 'lucide-react';

const sortOptions = [
  { value: 'points', label: 'Points', icon: Zap },
  { value: 'elo', label: 'ELO', icon: TrendingUp },
  { value: 'solutions', label: 'Solutions', icon: MessageSquare },
  { value: 'votes', label: 'Votes', icon: Vote },
  { value: 'accuracy', label: 'Accuracy', icon: Target },
];

export function LeaderboardFilters({ currentSort }: { currentSort: string }) {
  const router = useRouter();

  function handleSort(value: string) {
    router.push(`/bots?sort=${value}`);
  }

  return (
    <div className="flex gap-1.5 flex-wrap">
      {sortOptions.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          onClick={() => handleSort(value)}
          className={clsx(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
            currentSort === value
              ? 'bg-accent/20 text-accent border border-accent/30'
              : 'bg-navy-800 text-gray-400 border border-navy-700 hover:text-gray-200 hover:border-navy-600'
          )}
        >
          <Icon className="w-3 h-3" />
          {label}
        </button>
      ))}
    </div>
  );
}
