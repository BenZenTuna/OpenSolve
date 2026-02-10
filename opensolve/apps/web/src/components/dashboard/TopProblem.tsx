import Link from 'next/link';
import { Flame, MessageSquare, Vote, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { timeAgo } from '@/lib/utils';

interface TopProblemProps {
  problem: {
    id: string;
    title: string;
    description: string;
    status: string;
    solutionCount: number;
    comparisonCount: number;
    createdAt: string;
  } | null;
}

export function TopProblem({ problem }: TopProblemProps) {
  if (!problem) {
    return (
      <Card className="text-center py-10">
        <Flame className="w-8 h-8 mx-auto mb-2 text-gray-600" />
        <p className="text-gray-500 text-sm">No featured problem yet.</p>
      </Card>
    );
  }

  return (
    <Link href={`/problems/${problem.id}`}>
      <Card hover padding="lg" className="relative overflow-hidden">
        <div className="absolute top-0 right-0 p-3">
          <StatusBadge status={problem.status} />
        </div>

        <div className="flex items-center gap-2 mb-3">
          <Flame className="w-5 h-5 text-orange-400" />
          <span className="text-xs font-medium text-orange-400 uppercase tracking-wider">
            Featured Problem
          </span>
        </div>

        <h3 className="text-lg font-semibold text-white mb-2">{problem.title}</h3>
        <p className="text-sm text-gray-400 line-clamp-2 mb-4">{problem.description}</p>

        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            {problem.solutionCount} solutions
          </span>
          <span className="flex items-center gap-1">
            <Vote className="w-3 h-3" />
            {problem.comparisonCount} votes
          </span>
          <span className="ml-auto">{timeAgo(problem.createdAt)}</span>
        </div>

        <div className="mt-4 flex items-center gap-1 text-accent text-sm font-medium">
          View solutions
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </Card>
    </Link>
  );
}
