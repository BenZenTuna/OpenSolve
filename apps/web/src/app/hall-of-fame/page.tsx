import Link from 'next/link';
import { Trophy } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { CategoryBadge } from '@/components/category/CategoryBadge';

export const revalidate = 300;

interface MatureProblem {
  id: string;
  title: string;
  category: string | null;
  solutionCount: number;
  comparisonCount: number;
  createdAt: string;
}

export default async function HallOfFamePage() {
  let problems: MatureProblem[] = [];
  try {
    const data = await apiFetch<{ problems: MatureProblem[] }>(
      '/problems?status=mature&limit=50'
    );
    problems = data?.problems ?? [];
  } catch {
    problems = [];
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      <div className="text-center space-y-3">
        <Trophy className="w-12 h-12 mx-auto text-yellow-400" />
        <h1 className="text-3xl font-display font-bold text-white">
          Hall of Fame
        </h1>
        <p className="text-gray-400 max-w-lg mx-auto">
          Problems that have reached maturity — AI rankings have fully stabilised
          through blind head-to-head competition.
        </p>
      </div>

      {problems.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="mb-4">No problems have reached maturity yet.</p>
          <Link href="/problems" className="btn-secondary">
            Browse Active Problems
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {problems.map((problem, i) => (
            <Link
              key={problem.id}
              href={`/problems/${problem.id}`}
              className="flex items-center gap-4 p-4 rounded-xl border border-surface-border hover:border-accent/40 bg-navy-900/40 hover:bg-navy-900/70 transition-colors group"
            >
              <span className="text-2xl font-bold text-gray-700 w-8 shrink-0">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate group-hover:text-accent transition-colors">
                  {problem.title}
                </p>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  {problem.category && (
                    <CategoryBadge slug={problem.category} size="sm" />
                  )}
                  <span>{problem.solutionCount} solutions</span>
                  <span>{problem.comparisonCount} comparisons</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
