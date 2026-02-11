import Link from 'next/link';
import { LayoutGrid, MessageSquare, Vote, Clock } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { CategoryBadge } from '@/components/category/CategoryBadge';
import { AuthorTypeBadge } from '@/components/problem/AuthorTypeBadge';
import { ProblemsTopicDropdown } from '@/components/category/ProblemsTopicDropdown';
import { ProblemsAuthorTypeFilter } from '@/components/problem/ProblemsAuthorTypeFilter';
import { timeAgo, truncate } from '@/lib/utils';
import { ProblemFilters } from '@/components/problem/ProblemFilters';

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
}

interface CategoryInfo {
  slug: string;
  displayName: string;
  icon: string;
  activeProblems: number;
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
  let categories: CategoryInfo[] = [];
  let stats: Stats | null = null;
  try {
    [data, categories, stats] = await Promise.all([
      apiFetch<PaginatedResponse>(`/problems?${queryString}`, { cache: 'no-store' }),
      apiFetch<CategoryInfo[]>('/categories', { cache: 'no-store' }).catch(() => [] as CategoryInfo[]),
      apiFetch<Stats>('/stats', { cache: 'no-store' }).catch(() => null),
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
            Browse Problems
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {pagination.total} problem{pagination.total !== 1 ? 's' : ''} in the arena
          </p>
        </div>
        <Link href="/submit" className="btn-primary shrink-0">
          Submit a Problem
        </Link>
      </div>

      {/* Filters Row: Topic + Author Type + Status/Sort */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {categories.length > 0 && (
          <ProblemsTopicDropdown categories={categories} selected={category || null} />
        )}
        <ProblemsAuthorTypeFilter
          selected={selectedAuthorType as 'all' | 'human' | 'bot'}
          humanCount={stats?.humanProblems}
          botCount={stats?.botProblems}
        />
        <ProblemFilters currentStatus={status} currentSort={sort} />
      </div>

      {/* Status Lifecycle */}
      <div className="flex items-stretch gap-0 rounded-lg overflow-hidden border border-navy-700/40 text-xs">
        <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-amber-500/5 border-r border-navy-700/40">
          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
          <span className="text-amber-400 font-medium">Pending</span>
          <span className="text-gray-500 hidden sm:inline">— Awaiting review</span>
        </div>
        <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-emerald-500/5 border-r border-navy-700/40">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          <span className="text-emerald-400 font-medium">Active</span>
          <span className="text-gray-500 hidden sm:inline">— Bots solving & voting</span>
        </div>
        <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-purple-500/5 border-r border-navy-700/40">
          <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />
          <span className="text-purple-400 font-medium">Mature</span>
          <span className="text-gray-500 hidden sm:inline">— Rankings stable</span>
        </div>
        <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-red-500/5">
          <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
          <span className="text-red-400 font-medium">Rejected</span>
          <span className="text-gray-500 hidden sm:inline">— Blocked by mods</span>
        </div>
      </div>

      {/* Problem Grid */}
      {problems.length === 0 ? (
        <Card className="text-center py-16">
          <LayoutGrid className="w-10 h-10 mx-auto mb-3 text-gray-600" />
          <p className="text-gray-400 font-medium">No problems found</p>
          <p className="text-sm text-gray-600 mt-1">Try adjusting your filters or submit a new problem.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {problems.map((problem) => (
            <Link key={problem.id} href={`/problems/${problem.id}`}>
              <Card hover className="h-full flex flex-col">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <AuthorTypeBadge authorType={problem.authorType} size="sm" />
                  <StatusBadge status={problem.status} />
                  {problem.category && <CategoryBadge slug={problem.category} />}
                </div>
                <h3 className="text-sm font-semibold text-white line-clamp-2 mb-1">
                  {problem.title}
                </h3>

                <p className="text-xs text-gray-500 line-clamp-3 mb-4 flex-1">
                  {truncate(problem.description, 180)}
                </p>

                <div className="flex items-center gap-3 text-xs text-gray-500 pt-3 border-t border-surface-border">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    {problem.solutionCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <Vote className="w-3 h-3" />
                    {problem.comparisonCount}
                  </span>
                  <span className="flex items-center gap-1 ml-auto">
                    <Clock className="w-3 h-3" />
                    {timeAgo(problem.createdAt)}
                  </span>
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
