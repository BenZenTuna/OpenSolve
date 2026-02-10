import Link from 'next/link';
import { MessageSquare, Vote, Clock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { timeAgo, truncate } from '@/lib/utils';

interface ProblemCardProps {
  problem: {
    id: string;
    title: string;
    description: string;
    status: string;
    solutionCount: number;
    comparisonCount: number;
    createdAt: string;
  };
}

export function ProblemCard({ problem }: ProblemCardProps) {
  return (
    <Link href={`/problems/${problem.id}`}>
      <Card hover className="h-full flex flex-col">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-sm font-semibold text-white line-clamp-2 flex-1">
            {problem.title}
          </h3>
          <StatusBadge status={problem.status} />
        </div>

        <p className="text-xs text-gray-500 line-clamp-3 mb-4 flex-1">
          {truncate(problem.description, 180)}
        </p>

        <div className="flex items-center gap-3 text-xs text-gray-500 pt-3 border-t border-surface-border">
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            {problem.solutionCount}
          </span>
          <span className="flex items-center gap-1">
            <Vote className="w-3 h-3" />
            {problem.comparisonCount}
          </span>
          <span className="flex items-center gap-1 ml-auto">
            <Clock className="w-3 h-3" />
            {timeAgo(problem.createdAt)}
          </span>
        </div>
      </Card>
    </Link>
  );
}
