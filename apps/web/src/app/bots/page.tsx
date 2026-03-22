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

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

interface PageProps {
  searchParams: Promise<{
    sort?: string;
    page?: string;
    letter?: string;
    dirPage?: string;
  }>;
}

export default async function BotsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const sort = params.sort || 'elo';
  const page = parseInt(params.page || '1', 10);
  const letter = params.letter || '';
  const dirPage = parseInt(params.dirPage || '1', 10);

  // Build directory fetch URL
  const dirParams = new URLSearchParams({ sort: 'name', page: String(dirPage), limit: '10' });
  if (letter) dirParams.set('letter', letter);

  const [leaderboardData, directoryData] = await Promise.all([
    apiFetch<LeaderboardResponse>(
      `/leaderboard?sort=${sort}&page=${page}&limit=10`
    ).catch(() => ({ bots: [], myBot: null, pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } })),
    apiFetch<LeaderboardResponse>(
      `/leaderboard?${dirParams.toString()}`
    ).catch(() => ({ bots: [], myBot: null, pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } })),
  ]);

  const { bots: rankedBots, pagination } = leaderboardData;
  const { bots: allBots, pagination: dirPagination } = directoryData;
  const startRank = (page - 1) * pagination.limit;

  // Build URL helper that preserves all current params
  function buildUrl(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    const merged = { sort, page: String(page), letter, dirPage: String(dirPage), ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v) p.set(k, v);
    }
    return `/bots?${p.toString()}`;
  }

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

      {/* Your Bot Spotlight */}
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
              <Link href={buildUrl({ page: String(page - 1) })} className="btn-secondary text-sm">
                Previous
              </Link>
            )}
            <span className="text-sm text-gray-500 px-3">
              Page {page} of {pagination.totalPages}
            </span>
            {page < pagination.totalPages && (
              <Link href={buildUrl({ page: String(page + 1) })} className="btn-secondary text-sm">
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
            Browse {letter ? `"${letter}" bots` : `all ${dirPagination.total} registered bots`}
          </p>
        </div>

        {/* A-Z Filter — horizontal on mobile, vertical strip on desktop */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex flex-row flex-wrap md:flex-col gap-1 md:gap-0.5 shrink-0">
            <Link
              href={buildUrl({ letter: undefined, dirPage: '1' })}
              className={`px-2 py-1 md:px-2 md:py-0.5 rounded text-xs font-medium transition-colors ${
                !letter
                  ? 'bg-accent text-white'
                  : 'text-gray-400 hover:text-white hover:bg-navy-800'
              }`}
            >
              All
            </Link>
            {ALPHABET.map((l) => (
              <Link
                key={l}
                href={buildUrl({ letter: l, dirPage: '1' })}
                className={`px-2 py-1 md:px-2 md:py-0.5 rounded text-xs font-medium transition-colors text-center ${
                  letter?.toUpperCase() === l
                    ? 'bg-accent text-white'
                    : 'text-gray-500 hover:text-white hover:bg-navy-800'
                }`}
              >
                {l}
              </Link>
            ))}
          </div>

          {/* Bot grid */}
          <div className="flex-1">
            {allBots.length === 0 ? (
              <Card className="text-center py-16">
                <BotIcon className="w-10 h-10 mx-auto mb-3 text-gray-600" />
                <p className="text-gray-400 font-medium">
                  {letter ? `No bots starting with "${letter}"` : 'No bots registered yet'}
                </p>
              </Card>
            ) : (
              <BotDirectoryGrid bots={allBots} />
            )}

            {/* Directory Pagination */}
            {dirPagination.totalPages > 1 && (
              <nav className="flex items-center justify-center gap-2 mt-4">
                {dirPage > 1 && (
                  <Link href={buildUrl({ dirPage: String(dirPage - 1) })} className="btn-secondary text-sm">
                    Previous
                  </Link>
                )}
                <span className="text-sm text-gray-500 px-3">
                  Page {dirPage} of {dirPagination.totalPages}
                </span>
                {dirPage < dirPagination.totalPages && (
                  <Link href={buildUrl({ dirPage: String(dirPage + 1) })} className="btn-secondary text-sm">
                    Next
                  </Link>
                )}
              </nav>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
