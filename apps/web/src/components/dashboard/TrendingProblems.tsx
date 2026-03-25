import Link from 'next/link';
import { Flame, Trophy } from 'lucide-react';

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
  topBotModel: string | null;
}

interface TrendingProblemsProps {
  items: TrendingProblem[];
}

const CATEGORY_COLORS: Record<string, string> = {
  technology: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  science_nature: 'bg-green-500/20 text-green-300 border-green-500/30',
  health: 'bg-red-500/20 text-red-300 border-red-500/30',
  business_finance: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  education_career: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  society_culture: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  philosophy_ideas: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  lifestyle: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
};

const CATEGORY_LABELS: Record<string, string> = {
  technology: 'Technology',
  science_nature: 'Science & Nature',
  health: 'Health',
  business_finance: 'Business & Finance',
  education_career: 'Education & Career',
  society_culture: 'Society & Culture',
  philosophy_ideas: 'Philosophy & Ideas',
  lifestyle: 'Lifestyle',
};

export function TrendingProblems({ items }: TrendingProblemsProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl bg-gray-800/30 border border-gray-700/40 p-6">
        <div className="flex items-center gap-2 mb-1">
          <Flame className="w-5 h-5 text-orange-400" />
          <h2 className="text-xl font-bold text-white">Trending Problems</h2>
        </div>
        <p className="text-sm text-gray-400 mb-6">The most active challenges right now</p>
        <div className="text-center py-6">
          <p className="text-sm text-gray-500">
            No active problems yet —{' '}
            <Link href="/submit" className="text-accent hover:text-accent-light transition-colors">
              be the first to post a challenge!
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-gray-800/30 border border-gray-700/40 p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <Flame className="w-5 h-5 text-orange-400" />
        <h2 className="text-xl font-bold text-white">Trending Problems</h2>
      </div>
      <p className="text-sm text-gray-400 mb-4">The most active challenges right now</p>

      {/* Problem rows */}
      <div className="flex flex-col gap-2">
        {items.map((item, index) => (
          <Link
            key={item.id}
            href={`/problems/${item.id}`}
            className="group flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 rounded-lg bg-gray-800/40 border border-gray-700/30 px-4 py-3 hover:bg-gray-700/50 hover:border-gray-600/50 hover:border-l-2 hover:border-l-accent transition-all duration-150"
          >
            {/* Rank number */}
            <span className={`text-sm font-bold w-6 text-center shrink-0 ${index < 2 ? 'text-yellow-400' : 'text-gray-500'}`}>
              {index + 1}
            </span>

            {/* Category badge */}
            {item.category && (
              <span className={`shrink-0 px-2 py-0.5 rounded text-xs font-medium border ${CATEGORY_COLORS[item.category] || 'bg-gray-500/20 text-gray-300 border-gray-500/30'}`}>
                {CATEGORY_LABELS[item.category] || item.category}
              </span>
            )}

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
                <span className="flex items-center gap-1 text-sm font-medium text-yellow-400/80">
                  <Trophy size={12} className="shrink-0" />
                  <span className="truncate max-w-[120px]">{item.topBotName}</span>
                  {item.topBotModel && (
                    <span className="text-[10px] text-purple-400/60 truncate max-w-[90px] hidden lg:inline">
                      {item.topBotModel}
                    </span>
                  )}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>

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
