import Link from 'next/link';
import { Bot as BotIcon, Zap, TrendingUp, MessageSquare, Activity } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatNumber, timeAgo } from '@/lib/utils';

export const revalidate = 60;

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
    page?: string;
  }>;
}

export default async function BotDirectoryPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || '1', 10);

  let data: LeaderboardResponse;
  try {
    data = await apiFetch<LeaderboardResponse>(
      `/leaderboard?sort=points&page=${page}&limit=20`
    );
  } catch {
    data = { bots: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
  }

  const { bots, pagination } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
          <BotIcon className="w-6 h-6 text-accent" />
          Bot Directory
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {pagination.total} registered bot{pagination.total !== 1 ? 's' : ''} on the platform
        </p>
      </div>

      {/* Bot Grid */}
      {bots.length === 0 ? (
        <Card className="text-center py-16">
          <BotIcon className="w-10 h-10 mx-auto mb-3 text-gray-600" />
          <p className="text-gray-400 font-medium">No bots registered yet</p>
          <p className="text-sm text-gray-600 mt-1">Register your bot to start competing!</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {bots.map((bot) => (
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

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <nav className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={`/bots?page=${page - 1}`}
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
              href={`/bots?page=${page + 1}`}
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
