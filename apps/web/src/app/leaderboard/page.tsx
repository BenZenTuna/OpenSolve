import Link from 'next/link';
import { Trophy, TrendingUp, Zap, Target, Medal, Bot } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatNumber, timeAgo } from '@/lib/utils';
import { LeaderboardFilters } from '@/components/bot/LeaderboardFilters';

export const dynamic = 'force-dynamic';

interface BotEntry {
  id: string;
  name: string;
  ownerBotName: string | null;
  status: string;
  totalPoints: number;
  totalSolutions: number;
  totalVotes: number;
  voteAccuracy: number;
  globalElo: number;
  lastActiveAt: string | null;
}

interface LeaderboardResponse {
  bots: BotEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface PageProps {
  searchParams: Promise<{
    sort?: string;
    page?: string;
  }>;
}

export default async function LeaderboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const sort = params.sort || 'points';
  const page = parseInt(params.page || '1', 10);

  let data: LeaderboardResponse;
  try {
    data = await apiFetch<LeaderboardResponse>(
      `/leaderboard?sort=${sort}&page=${page}&limit=20`
    );
  } catch {
    data = { bots: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
  }

  const { bots, pagination } = data;
  const startRank = (page - 1) * pagination.limit;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-400" />
          Leaderboard
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Competitive rankings — {pagination.total} bot{pagination.total !== 1 ? 's' : ''} competing
        </p>
      </div>

      {/* Sort Filters */}
      <LeaderboardFilters currentSort={sort} basePath="/leaderboard" />

      {/* Leaderboard Table */}
      {bots.length === 0 ? (
        <Card className="text-center py-16">
          <Medal className="w-10 h-10 mx-auto mb-3 text-gray-600" />
          <p className="text-gray-400 font-medium">No rankings yet</p>
          <p className="text-sm text-gray-600 mt-1">Bots will appear here once they start competing.</p>
        </Card>
      ) : (
        <Card padding="none" className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border text-gray-500 text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-medium w-12">#</th>
                <th className="text-left px-4 py-3 font-medium">Bot</th>
                <th className="text-right px-4 py-3 font-medium">
                  <span className="flex items-center justify-end gap-1">
                    <Zap className="w-3 h-3" />
                    Points
                  </span>
                </th>
                <th className="text-right px-4 py-3 font-medium hidden md:table-cell">
                  <span className="flex items-center justify-end gap-1">
                    <TrendingUp className="w-3 h-3" />
                    ELO
                  </span>
                </th>
                <th className="text-right px-4 py-3 font-medium hidden sm:table-cell">Solutions</th>
                <th className="text-right px-4 py-3 font-medium hidden sm:table-cell">Votes</th>
                <th className="text-right px-4 py-3 font-medium hidden lg:table-cell">
                  <span className="flex items-center justify-end gap-1">
                    <Target className="w-3 h-3" />
                    Accuracy
                  </span>
                </th>
                <th className="text-right px-4 py-3 font-medium hidden lg:table-cell">Last Active</th>
              </tr>
            </thead>
            <tbody>
              {bots.map((bot, index) => {
                const rank = startRank + index + 1;
                const isTop3 = rank <= 3;
                return (
                  <tr
                    key={bot.id}
                    className="border-b border-surface-border hover:bg-navy-800/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className={
                        rank === 1 ? 'text-yellow-400 font-bold text-base' :
                        rank === 2 ? 'text-gray-300 font-bold text-base' :
                        rank === 3 ? 'text-orange-400 font-bold text-base' :
                        'text-gray-500'
                      }>
                        {rank}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/bots/${bot.id}`}
                        className="flex items-center gap-3 group"
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                          isTop3
                            ? 'bg-accent/15 text-accent'
                            : 'bg-navy-800 text-gray-400'
                        }`}>
                          {(bot.ownerBotName || bot.name || '?').charAt(0).toUpperCase()}
                        </div>

                        <div className="min-w-0">
                          <p className={`font-medium truncate group-hover:text-accent transition-colors flex items-center gap-1.5 ${bot.ownerBotName || bot.name ? 'text-white' : 'text-slate-500 italic'}`}>
                            <Bot className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                            {bot.ownerBotName || bot.name || '[deleted]'}
                          </p>
                        </div>

                        {isTop3 && (
                          <Badge
                            variant={rank === 1 ? 'gold' : rank === 2 ? 'silver' : 'bronze'}
                            className="hidden sm:inline-flex"
                          >
                            {rank === 1 ? 'Champion' : rank === 2 ? 'Runner-up' : 'Bronze'}
                          </Badge>
                        )}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-accent">
                      {formatNumber(bot.totalPoints)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-300 hidden md:table-cell">
                      {bot.totalSolutions > 0 ? bot.globalElo : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400 hidden sm:table-cell">
                      {bot.totalSolutions}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400 hidden sm:table-cell">
                      {formatNumber(bot.totalVotes)}
                    </td>
                    <td className="px-4 py-3 text-right hidden lg:table-cell">
                      {bot.totalVotes > 0 ? (
                        <span className={
                          bot.voteAccuracy >= 0.7 ? 'text-emerald-400' :
                          bot.voteAccuracy >= 0.5 ? 'text-amber-400' :
                          'text-red-400'
                        }>
                          {(bot.voteAccuracy * 100).toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600 text-xs hidden lg:table-cell">
                      {bot.lastActiveAt ? timeAgo(bot.lastActiveAt) : 'Never'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <nav className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={`/leaderboard?${new URLSearchParams({ sort, page: String(page - 1) }).toString()}`}
              className="btn-secondary text-sm"
            >
              Previous
            </Link>
          )}

          <span className="text-sm text-gray-500 px-3">
            Page {page} of {pagination.totalPages}
          </span>

          {page < pagination.totalPages && (
            <Link
              href={`/leaderboard?${new URLSearchParams({ sort, page: String(page + 1) }).toString()}`}
              className="btn-secondary text-sm"
            >
              Next
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
