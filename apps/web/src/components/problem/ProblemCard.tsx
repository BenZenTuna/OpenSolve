import Link from 'next/link';
import { MessageSquare, Vote, Clock } from 'lucide-react';
import { StatusBadge } from '@/components/ui/Badge';
import { CategoryBadge } from '@/components/category/CategoryBadge';
import { AuthorTypeBadge } from '@/components/problem/AuthorTypeBadge';
import { timeAgo } from '@/lib/utils';

interface ProblemCardProps {
  problem: {
    id: string;
    title: string;
    description: string;
    status: string;
    category?: string | null;
    authorType?: string;
    solutionCount: number;
    comparisonCount: number;
    createdAt: string;
    topSolution?: {
      text: string;
      btScore: number;
      botName: string | null;
    } | null;
  };
}

export function ProblemCard({ problem }: ProblemCardProps) {
  return (
    <Link href={`/problems/${problem.id}`} className="block group">
      <div className="relative flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-4 py-3 sm:px-5 sm:py-4 rounded-xl bg-navy-800/60 border border-navy-700/50 hover:bg-navy-700/40 hover:border-navy-600/50 transition-all">

        {/* Author type badge — top right */}
        {problem.authorType && (
          <AuthorTypeBadge authorType={problem.authorType} size="sm" className="absolute top-3 right-3 sm:top-4 sm:right-4" />
        )}

        {/* Left: status + category */}
        <div className="flex items-center gap-2 pr-28 sm:pr-0 shrink-0 sm:flex-col sm:w-24">
          <StatusBadge status={problem.status} />
          {problem.category && <CategoryBadge slug={problem.category} />}
        </div>

        {/* Center: title + description */}
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-medium text-base sm:text-lg line-clamp-2 sm:line-clamp-1 sm:pr-28 group-hover:text-accent transition-colors">
            {problem.title}
          </h3>
          {problem.topSolution ? (
            <div className="mt-1.5 flex items-start gap-3">
              <span className="shrink-0 text-xs font-medium text-accent mt-0.5">
                {problem.topSolution.botName || 'Unknown Bot'}
              </span>
              <p className="text-sm text-gray-400 line-clamp-2">
                {problem.topSolution.text}
              </p>
            </div>
          ) : (
            <p className="mt-1.5 text-sm text-gray-600 italic">
              No solutions yet — bots are working on it
            </p>
          )}
        </div>

        {/* Right: stats */}
        <div className="flex items-center gap-4 shrink-0 text-sm text-gray-500">
          <span className="flex items-center gap-1" title="Solutions">
            <MessageSquare className="w-4 h-4" />
            {problem.solutionCount}
          </span>
          <span className="flex items-center gap-1" title="Comparisons">
            <Vote className="w-4 h-4" />
            {problem.comparisonCount}
          </span>
          <span className="text-xs text-gray-600">
            <Clock className="w-3.5 h-3.5 inline mr-1" />
            {timeAgo(problem.createdAt)}
          </span>
        </div>

      </div>
    </Link>
  );
}
