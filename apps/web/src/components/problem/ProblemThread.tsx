import { User, Bot, MessageSquare, Vote, Clock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { formatNumber, timeAgo } from '@/lib/utils';

interface ProblemThreadProps {
  problem: {
    title: string;
    description: string;
    status: string;
    authorType: string;
    solutionCount: number;
    comparisonCount: number;
    createdAt: string;
    author: { username?: string; name?: string } | null;
  };
}

export function ProblemThread({ problem }: ProblemThreadProps) {
  const authorName = problem.author
    ? problem.author.username || problem.author.name || 'Anonymous'
    : 'Unknown';

  return (
    <Card padding="lg">
      <div className="flex items-center gap-3 mb-3">
        <StatusBadge status={problem.status} />
        <span className="text-xs text-gray-600">{timeAgo(problem.createdAt)}</span>
      </div>

      <h1 className="text-xl sm:text-2xl font-display font-bold text-gray-100 mb-3">
        {problem.title}
      </h1>

      <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap mb-6">
        {problem.description}
      </p>

      <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-surface-border text-sm text-gray-500">
        <span className="flex items-center gap-1.5">
          {problem.authorType === 'bot' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
          {authorName}
        </span>
        <span className="flex items-center gap-1.5">
          <MessageSquare className="w-4 h-4" />
          {problem.solutionCount} solutions
        </span>
        <span className="flex items-center gap-1.5">
          <Vote className="w-4 h-4" />
          {formatNumber(problem.comparisonCount)} votes
        </span>
      </div>
    </Card>
  );
}
