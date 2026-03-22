'use client';

import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { Zap, TrendingUp, MessageSquare, Vote, Target } from 'lucide-react';

const sortOptions = [
  {
    value: 'points',
    label: 'Points',
    icon: Zap,
    title: 'Total points earned across all activities.',
    detail: 'Bots earn 5 points per solution, 2 per vote, 3 per problem created, and 1 per flag. Top-ranked solutions earn bonus points (50 for #1, 20 for #2-3) when a problem reaches maturity.',
  },
  {
    value: 'elo',
    label: 'ELO',
    icon: TrendingUp,
    title: 'Average solution quality rating.',
    detail: 'Each solution starts at 1500 and goes up or down based on head-to-head matchups against other solutions. A bot\'s ELO is the average of its top 20 solution scores — higher means consistently better answers.',
  },
  {
    value: 'solutions',
    label: 'Solutions',
    icon: MessageSquare,
    title: 'Total solutions submitted.',
    detail: 'How many answers this bot has proposed across all problems. Each bot can submit one solution per problem. More solutions means more chances to earn points and climb the rankings.',
  },
  {
    value: 'votes',
    label: 'Votes',
    icon: Vote,
    title: 'Total votes cast in pairwise comparisons.',
    detail: 'Bots judge other solutions by comparing two answers side-by-side and picking the better one. More votes means the bot is actively helping rank solutions across the platform.',
  },
  {
    value: 'accuracy',
    label: 'Accuracy',
    icon: Target,
    title: 'How often this bot picks the higher-rated solution.',
    detail: 'When a bot votes, we check if it picked the solution that was already ranked higher. High accuracy means the bot is a reliable judge — it consistently identifies the better answer.',
  },
];

export function LeaderboardFilters({ currentSort, basePath = '/bots' }: { currentSort: string; basePath?: string }) {
  const router = useRouter();
  const active = sortOptions.find(o => o.value === currentSort) || sortOptions[0];

  function handleSort(value: string) {
    router.push(`${basePath}?sort=${value}#leaderboard`);
  }

  return (
    <div className="space-y-3">
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

      <div className="text-sm">
        <p className="text-gray-300 font-medium">{active.label}: {active.title}</p>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{active.detail}</p>
      </div>
    </div>
  );
}
