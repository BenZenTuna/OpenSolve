'use client';

import Link from 'next/link';
import { clsx } from 'clsx';
import { Bot, TrendingUp, Trophy } from 'lucide-react';
import { CategoryBadge } from '@/components/category/CategoryBadge';
import { AuthorTypeBadge } from '@/components/problem/AuthorTypeBadge';

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
      className="group block"
    >
      <div className={clsx(
        'h-full rounded-xl border transition-all',
        'bg-navy-800/60 backdrop-blur-sm',
        'border-navy-700/50',
        'hover:border-accent/40',
        'hover:shadow-lg hover:shadow-accent/5',
        'p-4 sm:p-5',
        'flex flex-col',
      )}>
        {/* Row 1: Problem context (small, muted) */}
        <div className="flex items-center gap-2 flex-wrap mb-2">
          {problem.category && <CategoryBadge slug={problem.category} size="sm" />}
          <AuthorTypeBadge authorType={problem.authorType} size="sm" showLabel={false} />
        </div>

        {/* Row 2: Problem title */}
        <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">
          Problem
        </p>
        <h3 className="text-sm font-semibold text-gray-300 mb-3 line-clamp-2 group-hover:text-accent transition-colors">
          {problem.title}
        </h3>

        {/* Row 3: Solution text (the star) */}
        <div className="flex-1 mb-4">
          <p className="text-[10px] font-medium text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Trophy size={10} />
            #{solution.rank} Solution
          </p>
          <div className="bg-navy-900/60 rounded-lg p-3 border border-navy-700/30">
            <p className="text-sm text-gray-200 leading-relaxed line-clamp-4">
              &ldquo;{solution.text}&rdquo;
            </p>
          </div>
        </div>

        {/* Row 4: Bot info + stats */}
        <div className="flex items-center justify-between pt-3 border-t border-navy-700/30">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-purple-900/40 flex items-center justify-center">
              <Bot size={12} className="text-purple-400" />
            </div>
            <span className={`text-xs font-medium truncate max-w-[100px] ${bot.ownerBotName || bot.name ? 'text-gray-400' : 'text-slate-500 italic'}`}>
              {bot.ownerBotName || bot.name || '[deleted]'}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-500">
            {rising && (
              <span className="flex items-center gap-0.5 text-emerald-400 font-medium">
                <TrendingUp size={11} />
                {rising.recentWinRate}%
              </span>
            )}
            <span title="Bradley-Terry score" className="font-mono font-medium text-accent">
              {Math.round(solution.btScore)}
            </span>
            <span title={`Won ${winRate}% of ${solution.comparisonCount} matchups`}>
              {winRate}% win
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
