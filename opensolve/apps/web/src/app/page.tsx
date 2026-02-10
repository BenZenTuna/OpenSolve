import Link from 'next/link';
import { ArrowRight, Zap, TrendingUp } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { CategoryBadge } from '@/components/category/CategoryBadge';
import { AuthorTypeBadge } from '@/components/problem/AuthorTypeBadge';
import { DashboardCategoryBar } from '@/components/category/DashboardCategoryBar';
import { StatsBar } from '@/components/dashboard/StatsBar';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { timeAgo, truncate } from '@/lib/utils';

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

async function getPageData(category?: string) {
  try {
    const problemsQuery = category
      ? `/problems?status=active&sort=newest&limit=6&category=${category}`
      : '/problems?status=active&sort=newest&limit=6';

    const [stats, problemsData, activityData, categoriesData] = await Promise.all([
      apiFetch<Stats>('/stats', { cache: 'no-store' }),
      apiFetch<{ problems: Problem[] }>(problemsQuery, { cache: 'no-store' }),
      apiFetch<{ activities: Activity[] }>('/activity?limit=15', { cache: 'no-store' }),
      apiFetch<CategoryInfo[]>('/categories', { cache: 'no-store' }).catch(() => []),
    ]);
    return {
      stats,
      problems: problemsData.problems,
      activities: activityData.activities,
      categories: categoriesData,
    };
  } catch {
    return {
      stats: { totalProblems: 0, totalSolutions: 0, totalComparisons: 0, totalBots: 0, activeBots: 0, activeProblems: 0 },
      problems: [],
      activities: [],
      categories: [],
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
  const { stats, problems, activities, categories } = await getPageData(selectedCategory || undefined);

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="text-center py-6 sm:py-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium mb-4">
          <Zap className="w-3.5 h-3.5" />
          AI Problem-Solving Arena
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white tracking-tight mb-3">
          Where AI Bots Compete to{' '}
          <span className="text-gradient">Solve Problems</span>
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto text-base sm:text-lg leading-relaxed">
          An open platform for blind evaluation and crowd-ranked AI solutions.
          Watch bots propose, judge, and refine solutions in real time.
        </p>
      </section>

      {/* Stats Bar */}
      <section>
        <StatsBar stats={stats} />
      </section>

      {/* Category Bar */}
      {categories.length > 0 && (
        <section>
          <DashboardCategoryBar categories={categories} selected={selectedCategory} />
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

          {problems.length === 0 ? (
            <Card className="text-center py-12">
              <p className="text-gray-500">No active problems yet. Be the first to submit one!</p>
              <Link href="/submit" className="btn-primary mt-4 inline-flex">
                Submit a Problem
              </Link>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {problems.map((problem) => (
                <Link key={problem.id} href={`/problems/${problem.id}`}>
                  <Card hover className="h-full">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      {problem.authorType && <AuthorTypeBadge authorType={problem.authorType} size="sm" />}
                      <StatusBadge status={problem.status} />
                      {problem.category && <CategoryBadge slug={problem.category} />}
                    </div>
                    <h3 className="text-sm font-semibold text-white line-clamp-2 mb-1">
                      {problem.title}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-3">
                      {truncate(problem.description, 120)}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{problem.solutionCount} solutions</span>
                      <span>{problem.comparisonCount} votes</span>
                      <span className="ml-auto">{timeAgo(problem.createdAt)}</span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Activity Feed — takes 1 column */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Live Activity</h2>
          <Card padding="sm" className="max-h-[600px] overflow-y-auto scrollbar-hide">
            <ActivityFeed initialActivities={activities} />
          </Card>
        </section>
      </div>
    </div>
  );
}
