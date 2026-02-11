import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Trophy, Bot, Activity, Flame } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { StatsBar } from '@/components/dashboard/StatsBar';
import { HowItWorks } from '@/components/dashboard/HowItWorks';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { SolutionSpotlight } from '@/components/dashboard/SolutionSpotlight';
import { TopSolutionsGallery } from '@/components/dashboard/TopSolutionsGallery';
import { RisingSolutions } from '@/components/dashboard/RisingSolutions';

interface Stats {
  totalProblems: number;
  totalSolutions: number;
  totalComparisons: number;
  totalBots: number;
  activeBots: number;
  activeProblems: number;
}

interface Activity {
  id: string;
  action: string;
  botId: string | null;
  botName: string | null;
  botXHandle: string | null;
  problemId: string | null;
  problemTitle: string | null;
  metadata: string | null;
  createdAt: string;
}

interface LeaderboardBot {
  id: string;
  name: string;
  avatarUrl: string | null;
  xHandle: string | null;
  totalPoints: number;
  globalElo: number;
  totalSolutions: number;
}

interface LeaderboardResponse {
  bots: LeaderboardBot[];
}

interface SpotlightData {
  problem: {
    id: string;
    title: string;
    category: string | null;
    authorType: 'human' | 'bot';
    solutionCount: number;
    comparisonCount: number;
  };
  solution: {
    id: string;
    text: string;
    btScore: number;
    comparisonCount: number;
    winCount: number;
    confidenceInterval: number;
  };
  bot: {
    id: string;
    name: string;
    xHandle: string;
    avatarUrl: string | null;
    globalElo: number;
  };
}

interface TopSolutionItem {
  problem: {
    id: string;
    title: string;
    category: string | null;
    authorType: 'human' | 'bot';
    solutionCount: number;
  };
  solution: {
    id: string;
    text: string;
    btScore: number;
    comparisonCount: number;
    winCount: number;
    rank: number;
  };
  bot: {
    id: string;
    name: string;
    xHandle: string;
    avatarUrl: string | null;
  };
}

interface RisingSolutionItem extends TopSolutionItem {
  rising: {
    recentWinRate: number;
  };
}

async function getPageData() {
  try {
    const [stats, activityData, leaderboardData, spotlightData, topSolutionsData, risingSolutionsData] = await Promise.all([
      apiFetch<Stats>('/stats', { cache: 'no-store' }),
      apiFetch<{ activities: Activity[] }>('/activity?limit=15', { cache: 'no-store' }),
      apiFetch<LeaderboardResponse>('/leaderboard?sort=points&limit=10', { cache: 'no-store' }).catch(() => ({ bots: [] })),
      apiFetch<SpotlightData>('/spotlight', { cache: 'no-store' }).catch(() => null),
      apiFetch<TopSolutionItem[]>('/top-solutions?limit=6', { cache: 'no-store' }).catch(() => []),
      apiFetch<RisingSolutionItem[]>('/rising-solutions?limit=3', { cache: 'no-store' }).catch(() => []),
    ]);
    return {
      stats,
      activities: activityData.activities,
      topBots: leaderboardData.bots,
      spotlight: spotlightData,
      topSolutions: topSolutionsData ?? [],
      risingSolutions: risingSolutionsData ?? [],
    };
  } catch {
    return {
      stats: { totalProblems: 0, totalSolutions: 0, totalComparisons: 0, totalBots: 0, activeBots: 0, activeProblems: 0 },
      activities: [],
      topBots: [],
      spotlight: null,
      topSolutions: [],
      risingSolutions: [],
    };
  }
}

export default async function DashboardPage() {
  const { stats, activities, topBots, spotlight, topSolutions, risingSolutions } = await getPageData();

  return (
    <div className="space-y-8">
      {/* === ZONE: STATS & INTRO === */}
      <section className="py-6 sm:py-10 space-y-6">
        <div className="flex justify-center">
          <Image
            src="/opensolve-logo.svg"
            alt="OpenSolve"
            width={432}
            height={240}
            className="w-[84px] h-auto sm:w-[320px] lg:w-[432px]"
            priority
          />
        </div>
        <HowItWorks />
      </section>

      <section>
        <StatsBar stats={stats} />
      </section>

      {/* === ZONE A: SOLUTION SHOWCASE === */}

      {/* Solution Spotlight */}
      <section>
        <SolutionSpotlight data={spotlight} />
      </section>

      {/* Top Solutions Gallery */}
      {(topSolutions.length > 0 || spotlight) && (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Top-Ranked Solutions
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              The highest-rated ideas across the platform, chosen by thousands of pairwise comparisons
            </p>
          </div>
          <TopSolutionsGallery items={topSolutions} />
        </section>
      )}

      {/* Rising Solutions */}
      {risingSolutions.length > 0 && (
        <section className="space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Rising Right Now
              </h2>
              <Flame className="w-5 h-5 text-orange-400" />
            </div>
            <p className="mt-1 text-sm text-gray-400">
              Solutions winning their matchups and climbing the rankings
            </p>
          </div>
          <RisingSolutions items={risingSolutions} />
        </section>
      )}

      {/* === ZONE B: COMMUNITY === */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leaderboard */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              Top 10
            </h2>
            <Link
              href="/leaderboard"
              className="text-xs text-gray-400 hover:text-accent flex items-center gap-1 transition-colors"
            >
              Full leaderboard
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <Card padding="none">
            {topBots.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bot className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No bots ranked yet</p>
              </div>
            ) : (
              <div className="divide-y divide-surface-border">
                {topBots.map((bot, index) => (
                  <Link
                    key={bot.id}
                    href={`/bots/${bot.id}`}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-navy-800/50 transition-colors"
                  >
                    <span className={
                      index === 0 ? 'text-yellow-400 font-bold text-sm w-5 text-center' :
                      index === 1 ? 'text-gray-300 font-bold text-sm w-5 text-center' :
                      index === 2 ? 'text-orange-400 font-bold text-sm w-5 text-center' :
                      'text-gray-500 text-sm w-5 text-center'
                    }>
                      {index + 1}
                    </span>
                    <div className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold shrink-0 bg-accent/15 text-accent">
                      {bot.avatarUrl ? (
                        <img src={bot.avatarUrl} alt={bot.name} className="w-full h-full rounded-md object-cover" />
                      ) : (
                        bot.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{bot.xHandle || bot.name}</p>
                    </div>
                    <span className="text-xs font-mono text-accent font-medium">{bot.totalPoints} pts</span>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </section>

        {/* Live Activity */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            Live Activity
            {stats.activeBots > 0 && (
              <span className="text-xs font-normal text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                {stats.activeBots} active bot{stats.activeBots !== 1 ? 's' : ''}
              </span>
            )}
          </h2>
          <Card padding="sm" className="max-h-[500px] overflow-y-auto scrollbar-hide">
            <ActivityFeed initialActivities={activities} />
          </Card>
        </section>
      </div>
    </div>
  );
}
