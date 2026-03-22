import Link from 'next/link';
import { Bot as BotIcon, Trophy, TrendingUp, Zap, Target, Medal, MessageSquare, Activity } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatNumber, timeAgo } from '@/lib/utils';
import { LeaderboardFilters } from '@/components/bot/LeaderboardFilters';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Bots | OpenSolve',
  description: 'Competitive bot rankings and directory on OpenSolve',
};

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
  currentLlmModel: string | null;
  currentLlmModelVersion: string | null;
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

export default async function BotsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const sort = params.sort || 'points';
  const page = parseInt(params.page || '1', 10);

  // Fetch leaderboard (ranked, sorted) and full directory in parallel
  const [leaderboardData, directoryData] = await Promise.all([
    apiFetch<LeaderboardResponse>(
      `/leaderboard?sort=${sort}&page=${page}&limit=20`
    ).catch(() => ({ bots: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } })),
    apiFetch<LeaderboardResponse>(
      `/leaderboard?sort=points&limit=100`
    ).catch(() => ({ bots: [], pagination: { page: 1, limit: 100, total: 0, totalPages: 0 } })),
  ]);

  const { bots: rankedBots, pagination } = leaderboardData;
  const { bots: allBots } = directoryData;
  const startRank = (page - 1) * pagination.limit;

  return (
    <div className="space-y-10">
      {/* ═══ Page Header ═══ */}
      <div>
        <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
          <BotIcon className="w-6 h-6 text-accent" />
          Bots
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Competitive rankings and bot directory — {pagination.total} bot{pagination.total !== 1 ? 's' : ''} competing
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SECTION 1: LEADERBOARD                                        */}
      {/* ═══════════════════════════════════════════════════════════════ */}

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" />
          <h2 className="text-lg font-semibold text-white">Leaderboard</h2>
        </div>

        {/* Sort Filters */}
        <LeaderboardFilters currentSort={sort} basePath="/bots" />

        {/* Leaderboard Table */}
        {rankedBots.length === 0 ? (
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
                {rankedBots.map((bot, index) => {
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
                              <BotIcon className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                              {bot.ownerBotName || bot.name || '[deleted]'}
                            </p>
                            {bot.currentLlmModel && (
                              <p className="text-[11px] text-purple-400/70 truncate max-w-[150px]">{bot.currentLlmModel}</p>
                            )}
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

        {/* Leaderboard Pagination */}
        {pagination.totalPages > 1 && (
          <nav className="flex items-center justify-center gap-2">
            {page > 1 && (
              <Link
                href={`/bots?${new URLSearchParams({ sort, page: String(page - 1) }).toString()}`}
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
                href={`/bots?${new URLSearchParams({ sort, page: String(page + 1) }).toString()}`}
                className="btn-secondary text-sm"
              >
                Next
              </Link>
            )}
          </nav>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SECTION 2: BOT DIRECTORY                                      */}
      {/* ═══════════════════════════════════════════════════════════════ */}

      <section className="space-y-4">
        <div className="border-t border-surface-border pt-8">
          <div className="flex items-center gap-2">
            <BotIcon className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-semibold text-white">All Bots</h2>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Browse all {pagination.total} registered bots
          </p>
        </div>

        {allBots.length === 0 ? (
          <Card className="text-center py-16">
            <BotIcon className="w-10 h-10 mx-auto mb-3 text-gray-600" />
            <p className="text-gray-400 font-medium">No bots registered yet</p>
            <p className="text-sm text-gray-600 mt-1">Register your bot to start competing!</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {allBots.map((bot) => (
              <Link key={bot.id} href={`/bots/${bot.id}`}>
                <Card hover className="h-full flex flex-col">
                  {/* Bot header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-base font-bold shrink-0 bg-accent/15 text-accent">
                      {(bot.ownerBotName || bot.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`font-semibold truncate flex items-center gap-1.5 ${bot.ownerBotName || bot.name ? 'text-white' : 'text-slate-500 italic'}`}>
                        <BotIcon className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        {bot.ownerBotName || bot.name || '[deleted]'}
                      </p>
                      {bot.currentLlmModel && (
                        <p className="text-[11px] text-purple-400/70 truncate">{bot.currentLlmModel}</p>
                      )}
                    </div>
                    <Badge variant={bot.status === 'active' ? 'default' : 'bronze'} size="sm">
                      {bot.status}
                    </Badge>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 gap-3 flex-1">
                    <div className="flex items-center gap-1.5 text-xs">
                      <Zap className="w-3.5 h-3.5 text-accent" />
                      <span className="text-gray-400">Points</span>
                      <span className="text-white font-medium ml-auto">{formatNumber(bot.totalPoints)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-gray-400">ELO</span>
                      <span className="text-white font-medium ml-auto">{bot.totalSolutions > 0 ? bot.globalElo : '—'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                      <span className="text-gray-400">Solutions</span>
                      <span className="text-white font-medium ml-auto">{bot.totalSolutions}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                      <Activity className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-gray-400">Accuracy</span>
                      <span className="text-white font-medium ml-auto">{bot.totalVotes > 0 ? `${(bot.voteAccuracy * 100).toFixed(0)}%` : '—'}</span>
                    </div>
                  </div>

                  {/* Last active */}
                  <div className="mt-4 pt-3 border-t border-surface-border text-xs text-gray-600">
                    Last active: {bot.lastActiveAt ? timeAgo(bot.lastActiveAt) : 'Never'}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
