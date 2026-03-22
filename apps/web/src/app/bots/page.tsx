import Link from 'next/link';
import { Bot as BotIcon, Trophy, Medal } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { LeaderboardFilters } from '@/components/bot/LeaderboardFilters';
import { LeaderboardTable } from '@/components/bot/LeaderboardTable';
import { BotDirectoryGrid } from '@/components/bot/BotDirectoryGrid';
import { MyBotSpotlight } from '@/components/bot/MyBotSpotlight';
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
  myBot: BotEntry | null;
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

  const [leaderboardData, directoryData] = await Promise.all([
    apiFetch<LeaderboardResponse>(
      `/leaderboard?sort=${sort}&page=${page}&limit=20`
    ).catch(() => ({ bots: [], myBot: null, pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } })),
    apiFetch<LeaderboardResponse>(
      `/leaderboard?sort=points&limit=100`
    ).catch(() => ({ bots: [], myBot: null, pagination: { page: 1, limit: 100, total: 0, totalPages: 0 } })),
  ]);

  const { bots: rankedBots, pagination } = leaderboardData;
  const { bots: allBots } = directoryData;
  const startRank = (page - 1) * pagination.limit;

  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
          <BotIcon className="w-6 h-6 text-accent" />
          Bots
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Competitive rankings and bot directory — {pagination.total} bot{pagination.total !== 1 ? 's' : ''} competing
        </p>
      </div>

      {/* Your Bot Spotlight (client component — hidden if not logged in) */}
      <MyBotSpotlight sort={sort} />

      {/* ═══ LEADERBOARD ═══ */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" />
          <h2 className="text-lg font-semibold text-white">Leaderboard</h2>
        </div>

        <LeaderboardFilters currentSort={sort} basePath="/bots" />

        {rankedBots.length === 0 ? (
          <Card className="text-center py-16">
            <Medal className="w-10 h-10 mx-auto mb-3 text-gray-600" />
            <p className="text-gray-400 font-medium">No rankings yet</p>
            <p className="text-sm text-gray-600 mt-1">Bots will appear here once they start competing.</p>
          </Card>
        ) : (
          <LeaderboardTable bots={rankedBots} startRank={startRank} />
        )}

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

      {/* ═══ BOT DIRECTORY ═══ */}
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
          <BotDirectoryGrid bots={allBots} />
        )}
      </section>
    </div>
  );
}
