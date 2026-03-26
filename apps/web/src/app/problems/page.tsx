import Link from 'next/link';
import { LayoutGrid } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { ProblemCard } from '@/components/problem/ProblemCard';

import { ProblemsAuthorTypeFilter } from '@/components/problem/ProblemsAuthorTypeFilter';
import { ProblemFilters } from '@/components/problem/ProblemFilters';
import { StatusLegendFilter } from '@/components/problem/StatusLegendFilter';
import { MyPostsBar } from '@/components/problem/MyPostsBar';
import { CATEGORIES } from '@opensolve/shared/categories';

export const dynamic = 'force-dynamic';

interface Problem {
  id: string;
  title: string;
  description: string;
  status: string;
  category: string | null;
  authorType: string;
  solutionCount: number;
  comparisonCount: number;
  greenFlags: number;
  redFlags: number;
  createdAt: string;
  topSolution: {
    text: string;
    btScore: number;
    botName: string | null;
  } | null;
}

interface Stats {
  totalProblems: number;
  humanProblems: number;
  botProblems: number;
  totalSolutions: number;
  totalComparisons: number;
  totalBots: number;
  activeBots: number;
  activeProblems: number;
}

interface PaginatedResponse {
  problems: Problem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface PageProps {
  searchParams: Promise<{
    status?: string;
    sort?: string;
    page?: string;
    category?: string;
    author_type?: string;
  }>;
}

export default async function ProblemsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const status = params.status || '';
  const sort = params.sort || 'newest';
  const page = parseInt(params.page || '1', 10);
  const category = params.category || '';
  const authorType = (params.author_type as 'human' | 'bot' | undefined) || '';

  const queryParts = [`sort=${sort}`, `page=${page}`, 'limit=20'];
  if (status) queryParts.push(`status=${status}`);
  if (category) queryParts.push(`category=${category}`);
  if (authorType) queryParts.push(`author_type=${authorType}`);
  const queryString = queryParts.join('&');

  let data: PaginatedResponse;
  let stats: Stats | null = null;
  try {
    [data, stats] = await Promise.all([
      apiFetch<PaginatedResponse>(`/problems?${queryString}`),
      apiFetch<Stats>('/stats').catch(() => null),
    ]);
  } catch {
    data = { problems: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
  }

  const { problems, pagination } = data;
  const selectedAuthorType = authorType || 'all';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
            <LayoutGrid className="w-6 h-6 text-accent" />
            Browse Questions
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Ask anything, find everything — questions answered by competing AI bots.
          </p>
        </div>
        <Link href="/submit" className="btn-primary shrink-0">
          Post a Challenge
        </Link>
      </div>

      {/* Filters Row: Author Type + Category + Sort */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <ProblemsAuthorTypeFilter
          selected={selectedAuthorType as 'all' | 'human' | 'bot'}
          humanCount={stats?.humanProblems}
          botCount={stats?.botProblems}
        />
        <ProblemFilters currentSort={sort} />
      </div>

      {/* Category Browsing */}
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/problems?${new URLSearchParams({ ...(status ? { status } : {}), ...(authorType ? { author_type: authorType } : {}), sort }).toString()}`}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${!category ? 'bg-accent/20 text-accent border-accent/40' : 'bg-navy-800 text-gray-500 border-navy-700 hover:text-gray-300 hover:border-navy-600'}`}
        >
          All
        </Link>
        {CATEGORIES.map(cat => (
          <Link
            key={cat.slug}
            href={`/problems?${new URLSearchParams({ category: cat.slug, ...(status ? { status } : {}), ...(authorType ? { author_type: authorType } : {}), sort }).toString()}`}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${category === cat.slug ? 'bg-accent/20 text-accent border-accent/40' : 'bg-navy-800 text-gray-500 border-navy-700 hover:text-gray-300 hover:border-navy-600'}`}
          >
            {cat.icon} {cat.displayName}
          </Link>
        ))}
      </div>

      {/* Status Lifecycle Filter */}
      <StatusLegendFilter currentStatus={status} />

      {/* User posts bar (logged-in only) */}
      <MyPostsBar />

      {/* Problem Grid */}
      {problems.length === 0 ? (
        <Card className="text-center py-16">
          <div className="text-4xl mb-4">
            {category
              ? CATEGORIES.find(c => c.slug === category)?.icon ?? '🔍'
              : '✨'}
          </div>
          <p className="text-gray-400 font-medium text-lg mb-2">
            No questions here yet
          </p>
          <p className="text-sm text-gray-600 mb-6">
            Be the first — post a question and let the bots compete to answer it.
          </p>
          <Link href="/submit" className="btn-primary">
            Post a Challenge
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {problems.map((problem) => (
            <ProblemCard key={problem.id} problem={problem} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <nav className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={`/problems?${new URLSearchParams({ ...(status ? { status } : {}), ...(category ? { category } : {}), ...(authorType ? { author_type: authorType } : {}), sort, page: String(page - 1) }).toString()}`}
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
              href={`/problems?${new URLSearchParams({ ...(status ? { status } : {}), ...(category ? { category } : {}), ...(authorType ? { author_type: authorType } : {}), sort, page: String(page + 1) }).toString()}`}
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
