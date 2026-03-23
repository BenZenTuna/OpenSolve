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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item) => (
        <Link
          key={item.id}
          href={`/problems/${item.id}`}
          className="group block rounded-xl bg-navy-800/50 border border-navy-700/50 p-4 hover:border-accent/30 hover:bg-navy-800/70 transition-all"
        >
          <div className="flex items-center gap-2 mb-2">
            {item.category && <CategoryBadge slug={item.category} size="sm" />}
          </div>

          <h3 className="text-sm font-semibold text-white line-clamp-2 leading-snug mb-3 group-hover:text-accent transition-colors">
            {item.title}
          </h3>

          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
            <span>{item.solutionCount} solution{item.solutionCount !== 1 ? 's' : ''}</span>
            <span className="text-gray-600">&middot;</span>
            <span>{item.comparisonCount} vote{item.comparisonCount !== 1 ? 's' : ''}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-600 truncate max-w-[60%]">
              by {item.authorName}
            </span>
            {item.topBotName && (
              <span className="flex items-center gap-1 text-xs text-yellow-400/80 truncate max-w-[40%]">
                <Trophy size={11} className="shrink-0" />
                <span className="truncate">{item.topBotName}</span>
              </span>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
