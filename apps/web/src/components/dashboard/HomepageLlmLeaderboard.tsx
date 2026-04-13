import Link from 'next/link';
import { Trophy, ArrowRight } from 'lucide-react';
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
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base sm:text-lg font-semibold text-gray-100 flex items-center gap-2">
          <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
          <Link href="/llm-leaderboard" className="hover:text-blue-400 transition-colors">
            LLM Leaderboard
          </Link>
        </h2>
        <Link
          href="/llm-leaderboard"
          className="text-xs text-gray-400 hover:text-accent flex items-center gap-1 transition-colors"
        >
          View arena <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <Card padding="none">
        {models.length === 0 ? (
          <div className="px-3 sm:px-5 py-6 text-center text-xs text-gray-500">
            No models ranked yet
          </div>
        ) : (
          <div className="divide-y divide-surface-border">
            {models.map((model, i) => {
              const { color } = getModelFamily(model.modelName);
              const name = displayModelName(model.modelName);
              const winPct = (model.winRate * 100).toFixed(1);

              return (
                <Link
                  key={model.modelName}
                  href={`/llm-leaderboard/${encodeURIComponent(model.modelName)}`}
                  className="flex items-center gap-1.5 sm:gap-3 px-2 sm:px-4 py-1.5 sm:py-2.5 hover:bg-navy-800/50 transition-colors group"
                >
                  <span className="text-xs sm:text-sm font-medium text-gray-500 w-4 sm:w-5 text-right shrink-0">
                    {i + 1}
                  </span>

                  <span
                    className="hidden sm:inline-block h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />

                  <span className="text-xs sm:text-sm text-gray-100 group-hover:text-blue-400 transition-colors truncate min-w-0 flex-1 font-mono">
                    {name}
                  </span>

                  <span className="text-xs sm:text-sm font-medium text-emerald-400 shrink-0">
                    {winPct}%
                  </span>

                  <span className="hidden lg:inline text-xs text-gray-500 shrink-0 w-16 text-right">
                    {model.totalSolutions} solve{model.totalSolutions !== 1 ? 's' : ''}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </Card>
    </section>
  );
}
