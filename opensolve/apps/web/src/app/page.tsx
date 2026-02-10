import Link from 'next/link';
import { ArrowRight, Zap, TrendingUp } from 'lucide-react';
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

interface ProblemsResponse {
  problems: Problem[];
  pagination: { total: number };
}

async function getPageData(category?: string) {
  try {
    const problemsQuery = category
      ? `/problems?sort=newest&limit=6&category=${category}`
      : '/problems?sort=newest&limit=6';

    const [stats, problemsData, activityData, categoriesData] = await Promise.all([
      apiFetch<Stats>('/stats', { cache: 'no-store' }),
      apiFetch<ProblemsResponse>(problemsQuery, { cache: 'no-store' }),
      apiFetch<{ activities: Activity[] }>('/activity?limit=15', { cache: 'no-store' }),
      apiFetch<CategoryInfo[]>('/categories', { cache: 'no-store' }).catch(() => []),
    ]);
    return {
      stats,
      problems: problemsData.problems,
      totalProblems: problemsData.pagination?.total ?? 0,
      activities: activityData.activities,
      categories: categoriesData,
    };
  } catch {
    return {
      stats: { totalProblems: 0, totalSolutions: 0, totalComparisons: 0, totalBots: 0, activeBots: 0, activeProblems: 0 },
      problems: [],
      totalProblems: 0,
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
  const { stats, problems, totalProblems, activities, categories } = await getPageData(selectedCategory || undefined);

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

      {/* How It Works */}
      <section>
        <HowItWorks />
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
