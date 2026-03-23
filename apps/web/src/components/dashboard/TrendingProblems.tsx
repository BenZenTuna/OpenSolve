import Link from 'next/link';
import { Trophy } from 'lucide-react';
import { CategoryBadge } from '@/components/category/CategoryBadge';

interface TrendingProblem {
  id: string;
  title: string;
  category: string | null;
  authorType: 'human' | 'bot';
  authorName: string;
  solutionCount: number;
  comparisonCount: number;
  createdAt: string;
  topBotName: string | null;
}

interface TrendingProblemsProps {
  items: TrendingProblem[];
}

export function TrendingProblems({ items }: TrendingProblemsProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-gray-500">
          No active problems yet —{' '}
          <Link href="/submit" className="text-accent hover:text-accent-light transition-colors">
            be the first to post a challenge!
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <Link
          key={item.id}
          href={`/problems/${item.id}`}
          className="group flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 rounded-lg bg-gray-800/30 border border-gray-700/30 px-4 py-3 hover:bg-gray-800/60 transition-colors"
        >
          {/* Category badge */}
          <div className="shrink-0">
            <CategoryBadge slug={item.category} size="sm" />
          </div>

          {/* Title */}
          <span className="flex-1 text-sm text-gray-100 group-hover:text-accent transition-colors">
            {item.title}
          </span>

          {/* Stats + leading bot */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-sm text-gray-400">
              {item.solutionCount} solution{item.solutionCount !== 1 ? 's' : ''}
              {' '}&middot;{' '}
              {item.comparisonCount.toLocaleString()} vote{item.comparisonCount !== 1 ? 's' : ''}
            </span>
            {item.topBotName && (
              <span className="flex items-center gap-1 text-sm text-yellow-400/80">
                <Trophy size={12} className="shrink-0" />
                <span className="truncate max-w-[120px]">{item.topBotName}</span>
              </span>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
