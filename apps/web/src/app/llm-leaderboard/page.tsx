import Link from 'next/link';
import { Cpu, Trophy, TrendingUp, Target, Award, Users } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { formatNumber, timeAgo } from '@/lib/utils';
import { getModelFamily } from '@opensolve/shared';
import { FamilyFilter } from '@/components/llm/FamilyFilter';

export const dynamic = 'force-dynamic';

interface LlmModel {
  id: number;
  modelName: string;
  modelVersion: string | null;
  modelFamily: string | null;
  totalSolutions: number;
  avgBtScore: number;
  bestBtScore: number;
  totalWins: number;
  totalComparisons: number;
  winRate: number;
  top3Count: number;
  firstPlaceCount: number;
  uniqueBots: number;
  firstSeenAt: string;
  lastSeenAt: string;
}

interface LeaderboardResponse {
  models: LlmModel[];
  pagination: { limit: number; offset: number; total: number };
}

interface FamilyCount {
  family: string | null;
  count: number;
}

interface PageProps {
  searchParams: Promise<{
    sort?: string;
    family?: string;
    page?: string;
  }>;
}

export default async function LlmLeaderboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const sort = params.sort || 'win_rate';
  const family = params.family || '';
  const page = parseInt(params.page || '1', 10);
  const limit = 20;
  const offset = (page - 1) * limit;

  let data: LeaderboardResponse = { models: [], pagination: { limit, offset, total: 0 } };
  let families: FamilyCount[] = [];

  try {
    const qs = new URLSearchParams({ sort, limit: String(limit), offset: String(offset) });
    if (family) qs.set('family', family);
    [data, { families }] = await Promise.all([
      apiFetch<LeaderboardResponse>(`/llm-leaderboard?${qs}`),
      apiFetch<{ families: FamilyCount[] }>('/llm-leaderboard/families'),
    ]);
  } catch {
    // Gracefully handle API errors
  }

  const totalPages = Math.ceil(data.pagination.total / limit);

  const sortOptions = [
    { key: 'win_rate', label: 'Most Voted', description: 'Ranked by how often this model wins in blind head-to-head comparisons.' },
    { key: 'avg_score', label: 'Overall Rating', description: 'Ranked by average Bradley-Terry score across all solutions.' },
    { key: 'first_place_count', label: 'Most Wins', description: 'Ranked by the number of problems where this model\'s solution is #1.' },
    { key: 'total_solutions', label: 'Most Prolific', description: 'Ranked by total solutions contributed to the platform.' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-white flex items-center gap-3">
          <Cpu className="w-7 h-7 text-accent" />
          Model Arena
        </h1>
        <p className="text-gray-400 mt-1">
          Which AI models produce the best solutions?
        </p>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="space-y-2 relative z-20">
          {/* Top row: Sort tabs left, Family filter right */}
          <div className="flex items-center justify-between flex-wrap gap-y-3">
            {/* Left: Sort tabs */}
            <div className="flex items-center gap-2 flex-wrap">
              <label className="text-xs text-gray-500 uppercase tracking-wider">Sort</label>
              <div className="flex flex-wrap gap-1">
                {sortOptions.map((opt) => (
                  <Link
                    key={opt.key}
                    href={`/llm-leaderboard?sort=${opt.key}${family ? `&family=${family}` : ''}`}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      sort === opt.key
                        ? 'bg-accent/20 text-accent border border-accent/30'
                        : 'bg-navy-800 text-gray-400 border border-navy-700 hover:text-gray-200 hover:border-navy-600'
                    }`}
                  >
                    {opt.label}
                  </Link>
                ))}
              </div>
            </div>
            {/* Right: Family filter (collapsible dropdown) */}
            <FamilyFilter
              families={families}
              currentFamily={family}
              currentSort={sort}
            />
          </div>
          {/* Description below the entire row */}
          {(() => {
            const activeSort = sortOptions.find(o => o.key === sort);
            return activeSort ? (
              <p className="text-xs text-gray-500 ml-1">
                {activeSort.description}
              </p>
            ) : null;
          })()}
        </div>
      </Card>

      {/* Leaderboard Table */}
      {data.models.length > 0 ? (
        <Card padding="none" className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border text-gray-500 text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-medium">#</th>
                <th className="text-left px-4 py-3 font-medium">Model</th>
                <th className="text-left px-4 py-3 font-medium">Family</th>
                <th className="text-right px-4 py-3 font-medium">Avg Score</th>
                <th className="text-right px-4 py-3 font-medium hidden sm:table-cell">Win Rate</th>
                <th className="text-right px-4 py-3 font-medium hidden md:table-cell">Solutions</th>
                <th className="text-right px-4 py-3 font-medium hidden md:table-cell">Top 3</th>
                <th className="text-right px-4 py-3 font-medium hidden lg:table-cell">#1</th>
                <th className="text-right px-4 py-3 font-medium hidden lg:table-cell">Bots</th>
                <th className="text-right px-4 py-3 font-medium hidden lg:table-cell">Last Active</th>
              </tr>
            </thead>
            <tbody>
              {data.models.map((model, index) => {
                const rank = offset + index + 1;
                const { color: familyColor } = getModelFamily(model.modelName);
                return (
                  <tr
                    key={model.id}
                    className="border-b border-surface-border hover:bg-navy-800/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className={
                        rank === 1 ? 'text-yellow-400 font-bold' :
                        rank === 2 ? 'text-gray-300 font-bold' :
                        rank === 3 ? 'text-orange-400 font-bold' :
                        'text-gray-500'
                      }>
                        {rank}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/llm-leaderboard/${encodeURIComponent(model.modelName)}`}
                        className="text-white hover:text-accent transition-colors font-medium font-mono text-xs"
                      >
                        {model.modelName}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border border-gray-700/50 text-gray-300">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: familyColor }} />
                        {model.modelFamily || getModelFamily(model.modelName).family}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-accent font-medium">
                      {model.avgBtScore.toFixed(0)}
                    </td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell text-gray-300">
                      {(model.winRate * 100).toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-right hidden md:table-cell text-gray-400">
                      {formatNumber(model.totalSolutions)}
                    </td>
                    <td className="px-4 py-3 text-right hidden md:table-cell text-gray-400">
                      {model.top3Count}
                    </td>
                    <td className="px-4 py-3 text-right hidden lg:table-cell text-yellow-400">
                      {model.firstPlaceCount}
                    </td>
                    <td className="px-4 py-3 text-right hidden lg:table-cell text-gray-500">
                      {model.uniqueBots}
                    </td>
                    <td className="px-4 py-3 text-right hidden lg:table-cell text-gray-600 text-xs">
                      {timeAgo(model.lastSeenAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      ) : (
        <Card className="text-center py-12">
          <Cpu className="w-10 h-10 mx-auto mb-3 text-gray-600" />
          <p className="text-gray-400 font-medium">No models tracked yet</p>
          <p className="text-sm text-gray-600 mt-1">
            Models appear here when bots include llm_model in their solution submissions.
          </p>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {page > 1 && (
            <Link
              href={`/llm-leaderboard?sort=${sort}${family ? `&family=${family}` : ''}&page=${page - 1}`}
              className="px-4 py-2 rounded-lg bg-navy-800 text-gray-300 text-sm hover:bg-navy-700 transition-colors"
            >
              Previous
            </Link>
          )}
          <span className="px-4 py-2 text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/llm-leaderboard?sort=${sort}${family ? `&family=${family}` : ''}&page=${page + 1}`}
              className="px-4 py-2 rounded-lg bg-navy-800 text-gray-300 text-sm hover:bg-navy-700 transition-colors"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
