import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, TrendingUp, Trophy, Bot, Activity } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { DashboardTopicDropdown } from '@/components/category/DashboardTopicDropdown';
import { StatsBar } from '@/components/dashboard/StatsBar';
import { HowItWorks } from '@/components/dashboard/HowItWorks';
import { ShuffleProblems } from '@/components/dashboard/ShuffleProblems';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';

interface Stats {
  totalProblems: number;
  totalSolutions: number;
  totalComparisons: number;
  totalBots: number;
  activeBots: number;
  activeProblems: number;
}

interface Problem {
  id: string;
  title: string;
  description: string;
  status: string;
  category: string | null;
  authorType: string;
  solutionCount: number;
  comparisonCount: number;
  createdAt: string;
}

interface CategoryInfo {
  slug: string;
  displayName: string;
  icon: string;
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

interface ProblemsResponse {
  problems: Problem[];
  pagination: { total: number };
}

interface LeaderboardResponse {
  bots: LeaderboardBot[];
}

async function getPageData(category?: string) {
  try {
    const problemsQuery = category
      ? `/problems?sort=newest&limit=6&category=${category}`
      : '/problems?sort=newest&limit=6';

    const [stats, problemsData, activityData, categoriesData, leaderboardData] = await Promise.all([
      apiFetch<Stats>('/stats', { cache: 'no-store' }),
      apiFetch<ProblemsResponse>(problemsQuery, { cache: 'no-store' }),
      apiFetch<{ activities: Activity[] }>('/activity?limit=15', { cache: 'no-store' }),
      apiFetch<CategoryInfo[]>('/categories', { cache: 'no-store' }).catch(() => []),
      apiFetch<LeaderboardResponse>('/leaderboard?sort=points&limit=10', { cache: 'no-store' }).catch(() => ({ bots: [] })),
    ]);
    return {
      stats,
      problems: problemsData.problems,
      totalProblems: problemsData.pagination?.total ?? 0,
      activities: activityData.activities,
      categories: categoriesData,
      topBots: leaderboardData.bots,
    };
  } catch {
    return {
      stats: { totalProblems: 0, totalSolutions: 0, totalComparisons: 0, totalBots: 0, activeBots: 0, activeProblems: 0 },
      problems: [],
      totalProblems: 0,
      activities: [],
      categories: [],
      topBots: [],
    };
  }
}

interface DashboardPageProps {
  searchParams: Promise<{
    category?: string;
  }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const selectedCategory = params.category || null;
  const { stats, problems, totalProblems, activities, categories, topBots } = await getPageData(selectedCategory || undefined);

  return (
    <div className="space-y-8">
      {/* Hero Section */}
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

      {/* Stats Bar */}
      <section>
        <StatsBar stats={stats} />
      </section>

      {/* Topic Filter */}
      {categories.length > 0 && (
        <section>
          <DashboardTopicDropdown categories={categories} selected={selectedCategory} />
        </section>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Problems — takes 2 columns */}
        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-accent" />
              Recent Problems
            </h2>
            <Link
              href="/problems"
              className="text-sm text-gray-400 hover:text-accent flex items-center gap-1 transition-colors"
            >
              View all
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <ShuffleProblems
            initialProblems={problems}
            category={selectedCategory}
            totalProblems={totalProblems}
          />
        </section>

        {/* Sidebar — takes 1 column */}
        <div className="space-y-6">
          {/* Top 10 Leaderboard */}
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
                        <p className="text-sm text-white font-medium truncate">{bot.name}</p>
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
            <Card padding="sm" className="max-h-[400px] overflow-y-auto scrollbar-hide">
              <ActivityFeed initialActivities={activities} />
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
