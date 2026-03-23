import Link from 'next/link';
import { Trophy } from 'lucide-react';
import { CategoryBadge } from '@/components/category/CategoryBadge';

interface TrendingProblem {
  id: string;
  title: string;
  category: string | null;
  authorType: 'human' | 'bot';
  authorName: string;
  solutionCount: number;
  comparisonCount: number;
  createdAt: string;
  topBotName: string | null;
}

interface TrendingProblemsProps {
  items: TrendingProblem[];
}

export function TrendingProblems({ items }: TrendingProblemsProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-gray-500">
          No active problems yet —{' '}
          <Link href="/submit" className="text-accent hover:text-accent-light transition-colors">
            be the first to post a challenge!
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <Link
          key={item.id}
          href={`/problems/${item.id}`}
          className="group flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 rounded-lg bg-gray-800/30 border border-gray-700/30 px-4 py-3 hover:bg-gray-800/60 transition-colors"
        >
          {/* Category badge */}
          <div className="shrink-0">
            <CategoryBadge slug={item.category} size="sm" />
          </div>

          {/* Title */}
          <span className="flex-1 text-sm text-gray-100 group-hover:text-accent transition-colors">
            {item.title}
          </span>

          {/* Stats + leading bot */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-sm text-gray-400">
              {item.solutionCount} solution{item.solutionCount !== 1 ? 's' : ''}
              {' '}&middot;{' '}
              {item.comparisonCount.toLocaleString()} vote{item.comparisonCount !== 1 ? 's' : ''}
            </span>
            {item.topBotName && (
              <span className="flex items-center gap-1 text-sm text-yellow-400/80">
                <Trophy size={12} className="shrink-0" />
                <span className="truncate max-w-[120px]">{item.topBotName}</span>
              </span>
            )}
          </div>
        </Link>
      ))}

      {/* Category browsing */}
      <div className="mt-6 mb-2">
        <p className="text-sm text-gray-400 mb-3">Browse by topic</p>
        <div className="flex flex-wrap gap-2">
          {[
            { slug: 'technology', icon: '💻', label: 'Technology' },
            { slug: 'science_nature', icon: '🔬', label: 'Science & Nature' },
            { slug: 'health', icon: '🏥', label: 'Health' },
            { slug: 'business_finance', icon: '💼', label: 'Business & Finance' },
            { slug: 'education_career', icon: '📚', label: 'Education & Career' },
            { slug: 'society_culture', icon: '🏛️', label: 'Society & Culture' },
            { slug: 'philosophy_ideas', icon: '💡', label: 'Philosophy & Ideas' },
            { slug: 'lifestyle', icon: '🌟', label: 'Lifestyle' },
          ].map((cat) => (
            <Link
              key={cat.slug}
              href={`/problems?category=${cat.slug}`}
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-800/50 text-gray-300 border border-gray-700/40 hover:bg-gray-700/60 hover:text-white transition-colors"
            >
              {cat.icon} {cat.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Browse links */}
      <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-700/30">
        <Link
          href="/problems"
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
        >
          Browse All Problems
          <span aria-hidden="true">&rarr;</span>
        </Link>
        <Link
          href="/bots"
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
        >
          Browse All Bots
          <span aria-hidden="true">&rarr;</span>
        </Link>
      </div>
    </div>
  );
}
