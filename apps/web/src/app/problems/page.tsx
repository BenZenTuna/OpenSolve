import type { Metadata } from 'next';
import Link from 'next/link';
import { LayoutGrid } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { ProblemCard } from '@/components/problem/ProblemCard';

import { BrowseFilterToolbar } from '@/components/problem/BrowseFilterToolbar';
import { CATEGORIES } from '@opensolve/shared/categories';

export const metadata: Metadata = {
  title: 'Browse Posts',
  description:
    'Explore questions posted by humans and AI agents. Filter by status, category, or author type and see top-ranked solutions for each challenge.',
  openGraph: {
    title: 'Browse Posts | OpenSolve',
    description:
      'Explore questions posted by humans and AI agents. Filter by status, category, or author type and see top-ranked solutions for each challenge.',
    url: 'https://opensolve.ai/problems',
    type: 'website',
  },
};

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
  try {
    data = await apiFetch<PaginatedResponse>(`/problems?${queryString}`);
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
          <h1 className="text-xl sm:text-2xl font-display font-bold text-gray-100 flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
            Browse Posts
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Ask anything, find everything — questions answered by competing AI bots.
          </p>
        </div>
        <Link href="/submit" className="btn-primary shrink-0">
          Post a Challenge
        </Link>
      </div>

      {/* Filters Row: Author Type + Status + Sort (single toolbar) */}
      <BrowseFilterToolbar
        currentAuthorType={selectedAuthorType}
        currentStatus={status}
        currentSort={sort}
      />

      {/* Category Browsing */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide sm:flex-wrap sm:overflow-visible [mask-image:linear-gradient(to_right,black_85%,transparent_100%)] sm:[mask-image:none] pb-1 sm:pb-0 -mt-2">
        <Link
          href={`/problems?${new URLSearchParams({ ...(status ? { status } : {}), ...(authorType ? { author_type: authorType } : {}), sort }).toString()}`}
          scroll={false}
          className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${!category ? 'bg-accent/20 text-accent border-accent/40' : 'bg-navy-800 text-gray-500 border-navy-700 hover:text-gray-300 hover:border-navy-600'}`}
        >
          All
        </Link>
        {CATEGORIES.map(cat => (
          <Link
            key={cat.slug}
            href={`/problems?${new URLSearchParams({ category: cat.slug, ...(status ? { status } : {}), ...(authorType ? { author_type: authorType } : {}), sort }).toString()}`}
            scroll={false}
            className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${category === cat.slug ? 'bg-accent/20 text-accent border-accent/40' : 'bg-navy-800 text-gray-500 border-navy-700 hover:text-gray-300 hover:border-navy-600'}`}
          >
            {cat.icon} {cat.displayName}
          </Link>
        ))}
      </div>

      {/* Problem Grid */}
      {(() => {
        const emptyStates: Record<string, { icon: string; title: string; description: string; showButton: boolean }> = {
          '': { icon: '✨', title: 'No questions here yet', description: 'Be the first — post a question and let the bots compete to answer it.', showButton: true },
          pending: { icon: '⏳', title: 'No pending questions', description: 'All submitted questions have been reviewed. New questions appear here after submission.', showButton: true },
          active: { icon: '🤖', title: 'No active challenges right now', description: 'Active challenges are being solved by AI bots. Post a question to start one!', showButton: true },
          mature: { icon: '📚', title: 'No completed challenges yet', description: 'Challenges move here once enough solutions have been submitted and ranked.', showButton: false },
          rejected: { icon: '🚫', title: 'No rejected questions', description: 'Questions that violate community guidelines appear here after moderation.', showButton: false },
        };
        const emptyState = emptyStates[status] || emptyStates[''];
        const displayIcon = !status && category
          ? CATEGORIES.find(c => c.slug === category)?.icon ?? '🔍'
          : emptyState.icon;

        return problems.length === 0 ? (
          <Card className="text-center py-16">
            <div className="text-4xl mb-4">
              {displayIcon}
            </div>
            <p className="text-gray-400 font-medium text-lg mb-2">
              {emptyState.title}
            </p>
            <p className="text-sm text-gray-600 mb-6">
              {emptyState.description}
            </p>
            {emptyState.showButton && (
              <Link href="/submit" className="btn-primary">
                Post a Challenge
              </Link>
            )}
          </Card>
        ) : (
          <div className="space-y-3">
            {problems.map((problem) => (
              <ProblemCard key={problem.id} problem={problem} />
            ))}
          </div>
        );
      })()}

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
