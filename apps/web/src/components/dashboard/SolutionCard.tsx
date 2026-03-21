'use client';

import Link from 'next/link';
import { Bot, TrendingUp, Trophy } from 'lucide-react';
import { CategoryBadge } from '@/components/category/CategoryBadge';

interface SolutionCardProps {
  problem: {
    id: string;
    title: string;
    category: string | null;
    authorType: 'human' | 'bot';
    solutionCount: number;
  };
  solution: {
    id: string;
    text: string;
    btScore: number;
    rank: number;
    winCount: number;
    comparisonCount: number;
  };
  bot: {
    id: string;
    name: string;
    ownerBotName?: string | null;
  };
  rising?: {
    recentWinRate: number;
  };
}

export function SolutionCard({ problem, solution, bot, rising }: SolutionCardProps) {
  const winRate = solution.comparisonCount > 0
    ? Math.round((solution.winCount / solution.comparisonCount) * 100)
    : 0;

  return (
    <Link
      href={`/problems/${problem.id}`}
      className="group block py-3 px-4 rounded-lg hover:bg-navy-800/40 transition-colors"
    >
      {/* Desktop: horizontal layout */}
      <div className="hidden lg:flex items-start gap-4">
        {/* Rank badge */}
        <div className="shrink-0 mt-0.5">
          <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
            <Trophy size={12} />
            #{solution.rank}
          </span>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {problem.category && <CategoryBadge slug={problem.category} size="sm" />}
            <span className="text-xs text-gray-500 truncate">{problem.title}</span>
          </div>
          <p className="text-sm text-gray-300 line-clamp-2 leading-relaxed">
            &ldquo;{solution.text}&rdquo;
          </p>
        </div>

        {/* Bot + stats */}
        <div className="shrink-0 text-right space-y-1">
          <div className="flex items-center gap-1.5 justify-end">
            <Bot size={12} className="text-purple-400" />
            <span className="text-xs font-medium text-gray-400 truncate max-w-[100px]">
              {bot.ownerBotName || bot.name || '[deleted]'}
            </span>
          </div>
          <div className="flex items-center gap-2 justify-end text-xs text-gray-500">
            {rising && (
              <span className="flex items-center gap-0.5 text-emerald-400 font-medium">
                <TrendingUp size={11} />
                {rising.recentWinRate}%
              </span>
            )}
            <span className="font-mono font-medium text-accent">{Math.round(solution.btScore)}</span>
            <span>{winRate}% win</span>
          </div>
        </div>
      </div>

      {/* Mobile: clean vertical layout */}
      <div className="lg:hidden space-y-2">
        <p className="text-xs text-gray-500">{problem.title}</p>
        <p className="text-sm text-gray-300 line-clamp-3 leading-relaxed">
          &ldquo;{solution.text}&rdquo;
        </p>
        <div className="flex items-center gap-1.5">
          <Bot size={12} className="text-purple-400" />
          <span className="text-xs font-medium text-gray-400">
            {bot.ownerBotName || bot.name || '[deleted]'}
          </span>
          {rising && (
            <span className="flex items-center gap-0.5 text-emerald-400 text-xs font-medium ml-auto">
              <TrendingUp size={11} />
              {rising.recentWinRate}% win rate
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
