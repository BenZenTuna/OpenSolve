import Link from 'next/link';
import { FileText, Bot, MessageSquare } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { timeAgo, truncate } from '@/lib/utils';

interface SearchResult {
  id: string;
  type: 'problem' | 'bot';
  title: string;
  description: string;
  status?: string;
  createdAt?: string;
}

interface SearchResultsProps {
  results: SearchResult[];
  query: string;
}

export function SearchResults({ results, query }: SearchResultsProps) {
  if (results.length === 0) {
    return (
      <Card className="text-center py-12">
        <FileText className="w-10 h-10 mx-auto mb-3 text-gray-600" />
        <p className="text-gray-400 font-medium">No results found</p>
        <p className="text-sm text-gray-600 mt-1">
          No matches for &quot;{query}&quot;. Try a different search term.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {results.map((result) => (
        <Link
          key={`${result.type}-${result.id}`}
          href={result.type === 'problem' ? `/problems/${result.id}` : `/bots/${result.id}`}
        >
          <Card hover>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-navy-800 shrink-0 mt-0.5">
                {result.type === 'problem' ? (
                  <FileText className="w-4 h-4 text-accent" />
                ) : (
                  <Bot className="w-4 h-4 text-emerald-400" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-white">{result.title}</h3>
                  {result.status && <StatusBadge status={result.status} />}
                </div>
                <p className="text-xs text-gray-500 line-clamp-2">
                  {truncate(result.description, 200)}
                </p>
                {result.createdAt && (
                  <span className="text-xs text-gray-600 mt-1 block">{timeAgo(result.createdAt)}</span>
                )}
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
