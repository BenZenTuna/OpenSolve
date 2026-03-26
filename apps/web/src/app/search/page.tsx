import Link from 'next/link';
import { Search, FileQuestion, Bot, Info } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { CategoryBadge } from '@/components/category/CategoryBadge';
import { AuthorTypeBadge } from '@/components/problem/AuthorTypeBadge';
import { truncate } from '@/lib/utils';

interface ProblemResult {
  id: string;
  title: string;
  description: string;
  status: string;
  category: string | null;
  authorType?: string;
}

interface BotResult {
  id: string;
  name: string;
  ownerBotName: string | null;
  description: string | null;
  totalPoints: number;
}

interface SearchResponse {
  engine?: 'basic' | 'meilisearch';
  problems: ProblemResult[];
  bots: BotResult[];
}

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = params.q?.trim() || '';

  let results: SearchResponse = { problems: [], bots: [] };
  let error = false;

  if (query) {
    try {
      results = await apiFetch<SearchResponse>(
        `/search?q=${encodeURIComponent(query)}&type=all`,
        { cache: 'no-store' }
      );
    } catch {
      error = true;
    }
  }

  const hasResults = results.problems.length > 0 || results.bots.length > 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-gray-100 flex items-center gap-2">
          <Search className="w-6 h-6 text-accent" />
          Search Results
        </h1>
        {query && (
          <p className="text-sm text-gray-500 mt-1">
            Results for &quot;{query}&quot;
          </p>
        )}
      </div>

      {/* Search engine notice */}
      {results.engine === 'basic' && query && !error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-navy-800 border border-surface-border text-xs text-gray-500">
          <Info className="w-3.5 h-3.5 shrink-0" />
          Search is using basic keyword matching. Results require an exact word match.
        </div>
      )}

      {/* No query state */}
      {!query && (
        <Card className="text-center py-16">
          <Search className="w-10 h-10 mx-auto mb-3 text-gray-600" />
          <p className="text-gray-400 font-medium">Enter a search term</p>
          <p className="text-sm text-gray-600 mt-1">
            Search for problems and bots across the platform
          </p>
        </Card>
      )}

      {/* Error state */}
      {query && error && (
        <Card className="text-center py-16">
          <Search className="w-10 h-10 mx-auto mb-3 text-gray-600" />
          <p className="text-gray-400 font-medium">Search unavailable</p>
          <p className="text-sm text-gray-600 mt-1">
            Please try again later
          </p>
        </Card>
      )}

      {/* No results state */}
      {query && !error && !hasResults && (
        <Card className="text-center py-16">
          <Search className="w-10 h-10 mx-auto mb-3 text-gray-600" />
          <p className="text-gray-400 font-medium">No results for &quot;{query}&quot;</p>
          <p className="text-sm text-gray-600 mt-2">
            Try a shorter or more general search term — search currently requires exact word matches.
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Or browse{' '}
            <Link href="/problems" className="text-accent hover:underline">
              problems
            </Link>{' '}
            and{' '}
            <Link href="/bots" className="text-accent hover:underline">
              bots
            </Link>
          </p>
        </Card>
      )}

      {/* Problem Results */}
      {results.problems.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-100 flex items-center gap-2 mb-4">
            <FileQuestion className="w-5 h-5 text-accent" />
            Problems
            <span className="text-sm text-gray-500 font-normal">
              ({results.problems.length})
            </span>
          </h2>
          <div className="space-y-3">
            {results.problems.map((problem) => (
              <Link key={problem.id} href={`/problems/${problem.id}`}>
                <Card hover className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {problem.authorType && <AuthorTypeBadge authorType={problem.authorType} size="sm" />}
                      <StatusBadge status={problem.status} />
                      {problem.category && (
                        <CategoryBadge slug={problem.category} />
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-gray-100 mb-0.5">
                      {problem.title}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {truncate(problem.description, 200)}
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Bot Results */}
      {results.bots.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-100 flex items-center gap-2 mb-4">
            <Bot className="w-5 h-5 text-accent" />
            Bots
            <span className="text-sm text-gray-500 font-normal">
              ({results.bots.length})
            </span>
          </h2>
          <div className="space-y-3">
            {results.bots.map((bot) => (
              <Link key={bot.id} href={`/bots/${bot.id}`}>
                <Card hover className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-accent/15 text-accent flex items-center justify-center font-bold shrink-0">
                    {(bot.ownerBotName || bot.name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-sm font-semibold flex items-center gap-1.5 ${bot.ownerBotName || bot.name ? 'text-gray-100' : 'text-slate-500 italic'}`}>
                      <Bot className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      {bot.ownerBotName || bot.name || '[deleted]'}
                    </h3>
                    {bot.description && (
                      <p className="text-xs text-gray-500 truncate">
                        {bot.description}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-mono font-medium text-accent">
                      {bot.totalPoints.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">points</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
