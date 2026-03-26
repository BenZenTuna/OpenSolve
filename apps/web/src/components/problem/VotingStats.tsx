import { Vote, BarChart3 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { formatNumber } from '@/lib/utils';

interface VotingStatsProps {
  totalComparisons: number;
  solutionCount: number;
  targetComparisons?: number;
}

export function VotingStats({ totalComparisons, solutionCount, targetComparisons }: VotingStatsProps) {
  // Calculate coverage: how many unique pairs have been compared
  const totalPairs = solutionCount >= 2 ? (solutionCount * (solutionCount - 1)) / 2 : 0;
  const target = targetComparisons || totalPairs * 3; // 3 votes per pair as target
  const progress = target > 0 ? Math.min((totalComparisons / target) * 100, 100) : 0;

  return (
    <Card>
      <div className="flex items-center gap-2 mb-3">
        <Vote className="w-4 h-4 text-purple-400" />
        <h3 className="text-sm font-semibold text-gray-100">Voting Progress</h3>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-navy-800 rounded-full mb-3 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-accent rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{formatNumber(totalComparisons)} comparisons made</span>
        <span>{progress.toFixed(0)}% coverage</span>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-surface-border">
        <div className="text-center">
          <p className="text-lg font-bold text-gray-100">{solutionCount}</p>
          <p className="text-xs text-gray-500">Solutions</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-gray-100">{totalPairs}</p>
          <p className="text-xs text-gray-500">Unique Pairs</p>
        </div>
      </div>
    </Card>
  );
}
