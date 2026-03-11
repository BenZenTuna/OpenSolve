'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Shuffle, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { CategoryBadge } from '@/components/category/CategoryBadge';
import { AuthorTypeBadge } from '@/components/problem/AuthorTypeBadge';
import { apiUrl } from '@/lib/api';
import { timeAgo, truncate } from '@/lib/utils';

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

interface ShuffleProblemsProps {
  initialProblems: Problem[];
  category?: string | null;
  totalProblems: number;
}

export function ShuffleProblems({ initialProblems, category, totalProblems }: ShuffleProblemsProps) {
  const [problems, setProblems] = useState<Problem[]>(initialProblems);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const totalPages = Math.ceil(totalProblems / 6);

  const handleShuffle = useCallback(async () => {
    setLoading(true);
    try {
      const nextPage = page >= totalPages ? 1 : page + 1;
      const params = new URLSearchParams({
        sort: 'newest',
        limit: '6',
        page: String(nextPage),
      });
      if (category) params.set('category', category);

      const res = await fetch(apiUrl(`/problems?${params.toString()}`));
      if (res.ok) {
        const data = await res.json();
        if (data.problems && data.problems.length > 0) {
          setProblems(data.problems);
          setPage(nextPage);
        } else {
          // No more problems, wrap to page 1
          const res2 = await fetch(apiUrl(`/problems?sort=newest&limit=6&page=1${category ? `&category=${category}` : ''}`));
          if (res2.ok) {
            const data2 = await res2.json();
            setProblems(data2.problems || []);
            setPage(1);
          }
        }
      }
    } catch {
      // Fail silently
    } finally {
      setLoading(false);
    }
  }, [page, totalPages, category]);

  return (
    <>
      {problems.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-gray-500 mb-4">No questions here yet. Be the first!</p>
          <Link href="/submit" className="btn-primary inline-flex">
            Post a Challenge
          </Link>
        </Card>
      ) : (
        <>
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

          {totalProblems > 6 && (
            <div className="flex justify-center pt-2">
              <button
                onClick={handleShuffle}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-navy-800 border border-navy-700 text-gray-300 hover:text-white hover:border-accent/40 hover:bg-navy-700 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Shuffle className="w-4 h-4" />
                )}
                Shuffle for more posts
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
