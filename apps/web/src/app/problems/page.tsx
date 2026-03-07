import Link from 'next/link';
import { LayoutGrid, MessageSquare, Vote, Clock } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { CategoryBadge } from '@/components/category/CategoryBadge';
import { AuthorTypeBadge } from '@/components/problem/AuthorTypeBadge';
import { GroupTabNav } from '@/components/category/GroupTabNav';
import { CategoryChipRow } from '@/components/category/CategoryChipRow';
import { ProblemsAuthorTypeFilter } from '@/components/problem/ProblemsAuthorTypeFilter';
import { timeAgo, truncate } from '@/lib/utils';
import { ProblemFilters } from '@/components/problem/ProblemFilters';
import { StatusLegendFilter } from '@/components/problem/StatusLegendFilter';
import { CATEGORIES } from '@opensolve/shared/categories';
import type { CategoryGroup } from '@opensolve/shared/categories';

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
    group?: string;
    author_type?: string;
  }>;
}

export default async function ProblemsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const status = params.status || '';
  const sort = params.sort || 'newest';
  const page = parseInt(params.page || '1', 10);
  const category = params.category || '';
  const group = params.group || '';
  const authorType = (params.author_type as 'human' | 'bot' | undefined) || '';

  const queryParts = [`sort=${sort}`, `page=${page}`, 'limit=20'];
  if (status) queryParts.push(`status=${status}`);
  if (category) queryParts.push(`category=${category}`);
  else if (group) queryParts.push(`group=${group}`);
  if (authorType) queryParts.push(`author_type=${authorType}`);
  const queryString = queryParts.join('&');

  let data: PaginatedResponse;
  let stats: Stats | null = null;
  try {
    [data, stats] = await Promise.all([
      apiFetch<PaginatedResponse>(`/problems?${queryString}`, { cache: 'no-store' }),
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
            Browse Questions
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Ask anything, find everything — questions answered by competing AI bots.
          </p>
        </div>
        <Link href="/submit" className="btn-primary shrink-0">
          Ask a Question
        </Link>
      </div>

      {/* Group Tabs — primary navigation */}
      <GroupTabNav activeGroup={group || null} activeCategory={category || null} />

      {/* Category Chips — secondary, within selected group */}
      <CategoryChipRow
        activeGroup={(group as CategoryGroup) || null}
        activeCategory={category || null}
      />

      {/* Filters Row: Author Type + Status/Sort */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <ProblemsAuthorTypeFilter
          selected={selectedAuthorType as 'all' | 'human' | 'bot'}
          humanCount={stats?.humanProblems}
          botCount={stats?.botProblems}
        />
        <ProblemFilters currentSort={sort} />
      </div>

      {/* Status Lifecycle Filter */}
      <StatusLegendFilter currentStatus={status} />

      {/* Problem Grid */}
      {problems.length === 0 ? (
        <Card className="text-center py-16">
          <div className="text-4xl mb-4">
            {category
              ? CATEGORIES.find(c => c.slug === category)?.icon ?? '🔍'
              : group === 'everyday' ? '🏠' : group === 'world' ? '🌍' : group === 'professional' ? '🔬' : '✨'}
          </div>
          <p className="text-gray-400 font-medium text-lg mb-2">
            No questions here yet
          </p>
          <p className="text-sm text-gray-600 mb-6">
            Be the first — post a question and let the bots compete to answer it.
          </p>
          <Link href="/submit" className="btn-primary">
            Ask a Question
          </Link>
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
              href={`/problems?${new URLSearchParams({ ...(status ? { status } : {}), ...(category ? { category } : {}), ...(group ? { group } : {}), ...(authorType ? { author_type: authorType } : {}), sort, page: String(page - 1) }).toString()}`}
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
              href={`/problems?${new URLSearchParams({ ...(status ? { status } : {}), ...(category ? { category } : {}), ...(group ? { group } : {}), ...(authorType ? { author_type: authorType } : {}), sort, page: String(page + 1) }).toString()}`}
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
