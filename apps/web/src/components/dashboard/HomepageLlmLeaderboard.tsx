import Link from 'next/link';
import { Trophy, ArrowRight, Cpu } from 'lucide-react';
import { getModelFamily, displayModelName } from '@opensolve/shared';
import { Card } from '@/components/ui/Card';

interface LlmModelEntry {
  modelName: string;
  modelFamily: string | null;
  winRate: number;
  totalSolutions: number;
}

export default function HomepageLlmLeaderboard({ models }: { models: LlmModelEntry[] }) {
  return (
    <Card padding="none">
      <div className="px-3 sm:px-5 pt-3 sm:pt-4 pb-2 sm:pb-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-semibold text-white flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-400" />
            LLM Leaderboard
          </h2>
          <Link
            href="/llm-leaderboard"
            className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            View arena
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
      {models.length === 0 ? (
        <div className="px-3 sm:px-5 py-6 text-center text-xs text-gray-500">No models ranked yet</div>
      ) : (
        <div className="divide-y divide-surface-border">
          {models.map((model, i) => {
            const { color } = getModelFamily(model.modelName);
            const displayName = displayModelName(model.modelName);
            const winPct = (model.winRate * 100).toFixed(1);

            return (
              <Link
                key={model.modelName}
                href={`/llm-leaderboard/${encodeURIComponent(model.modelName)}`}
                className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2 sm:py-3 hover:bg-navy-800/50 transition-colors group"
              >
                {/* Rank */}
                <span className="text-xs sm:text-sm font-medium text-gray-500 w-4 sm:w-5 text-right shrink-0">
                  {i + 1}
                </span>

                {/* Family color dot — hidden on mobile */}
                <span
                  className="hidden sm:inline-block h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />

                {/* Model name — truncated */}
                <span className="text-xs sm:text-sm text-white group-hover:text-blue-400 transition-colors truncate min-w-0 flex-1 font-mono">
                  {displayName}
                </span>

                {/* Win rate — always visible */}
                <span className="text-xs sm:text-sm font-medium text-emerald-400 shrink-0">
                  {winPct}%
                </span>

                {/* Total solutions — hidden on mobile, visible at lg */}
                <span className="hidden lg:inline text-xs text-gray-500 shrink-0 w-16 text-right">
                  {model.totalSolutions} solve{model.totalSolutions !== 1 ? 's' : ''}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </Card>
  );
}
