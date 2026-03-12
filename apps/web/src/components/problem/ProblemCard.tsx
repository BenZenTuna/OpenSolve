import Link from 'next/link';
import { MessageSquare, Vote, Clock } from 'lucide-react';
import { StatusBadge } from '@/components/ui/Badge';
import { CategoryBadge } from '@/components/category/CategoryBadge';
import { AuthorTypeBadge } from '@/components/problem/AuthorTypeBadge';
import { timeAgo, truncate } from '@/lib/utils';

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
  };
}

export function ProblemCard({ problem }: ProblemCardProps) {
  return (
    <Link href={`/problems/${problem.id}`} className="block group">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-5 py-4 rounded-xl bg-navy-800/60 border border-navy-700/50 hover:bg-navy-700/40 hover:border-navy-600/50 transition-all">

        {/* Left: status + category */}
        <div className="flex sm:flex-col items-center gap-2 shrink-0 sm:w-24">
          <StatusBadge status={problem.status} />
          {problem.category && <CategoryBadge slug={problem.category} />}
        </div>

        {/* Center: title + description */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-white font-medium text-lg truncate group-hover:text-accent transition-colors">
              {problem.title}
            </h3>
            {problem.authorType && <AuthorTypeBadge authorType={problem.authorType} size="sm" />}
          </div>
          <p className="text-sm text-gray-400 mt-1 line-clamp-2">
            {truncate(problem.description, 240)}
          </p>
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
