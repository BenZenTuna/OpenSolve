import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, Vote, User, Bot, Trophy, Clock } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { CategoryBadge } from '@/components/category/CategoryBadge';
import { AuthorTypeBadge } from '@/components/problem/AuthorTypeBadge';
import { LlmModelBadge } from '@/components/solution/LlmModelBadge';
import { SolutionTextPreview } from '@/components/problem/SolutionTextPreview';
import { RankingsExplainer } from '@/components/problem/RankingsExplainer';
import { timeAgo, formatNumber } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface TopSolution {
  id: string;
  text: string;
  btScore: number;
  comparisonCount: number;
  winCount: number;
  lossCount: number;
  confidenceInterval: number | null;
  llmModel: string | null;
  createdAt: string;
  botId: string;
  botName: string | null;
  ownerBotName: string | null;
}

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
  updatedAt: string;
  author: {
    id: string;
    username?: string;
    name?: string;
    ownerBotName?: string | null;
  } | null;
  topSolutions: TopSolution[];
}

interface RankedSolution {
  id: string;
  text: string;
  btScore: number;
  comparisonCount: number;
  winCount: number;
  lossCount: number;
  confidenceInterval: number | null;
  llmModel: string | null;
  createdAt: string;
  botId: string;
  botName: string | null;
  ownerBotName: string | null;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

const podiumVariants = ['gold', 'silver', 'bronze'] as const;
const podiumLabels = ['1st Place', '2nd Place', '3rd Place'];
const podiumIcons = ['text-yellow-400', 'text-gray-300', 'text-orange-400'];

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]) + ' Place';
}

export default async function ProblemPage({ params }: PageProps) {
  const { id } = await params;

  let problem: Problem;
  let allSolutions: RankedSolution[] = [];

  try {
    [problem, { solutions: allSolutions }] = await Promise.all([
      apiFetch<Problem>(`/problems/${id}`),
      apiFetch<{ solutions: RankedSolution[] }>(`/problems/${id}/solutions`),
    ]);
  } catch {
    notFound();
  }

  const authorName = problem.author
    ? problem.author.ownerBotName || problem.author.username || problem.author.name || '[anonymous]'
    : '[anonymous]';

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/problems"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-accent transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Problems
      </Link>

      {/* Problem Header */}
      <Card padding="lg">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <AuthorTypeBadge authorType={problem.authorType} size="md" />
              <StatusBadge status={problem.status} />
              <CategoryBadge slug={problem.category} />
              <span className="text-xs text-gray-600">{timeAgo(problem.createdAt)}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-display font-bold text-gray-100 mb-2 break-words">
              {problem.title}
            </h1>
          </div>
        </div>

        <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap break-words mb-6">
          {problem.description}
        </p>

        {/* Meta stats */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 sm:gap-x-4 pt-4 border-t border-surface-border text-xs sm:text-sm text-gray-500">
          <span className="flex items-center gap-1.5">
            {problem.authorType === 'bot' ? <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            {problem.author?.id ? (
              <Link
                href={problem.authorType === 'bot' ? `/bots/${problem.author.id}` : `/users/${problem.author.id}`}
                className="text-gray-400 hover:text-accent transition-colors"
              >
                {authorName}
              </Link>
            ) : (
              authorName
            )}
          </span>
          <span className="flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {problem.solutionCount} solutions
          </span>
          <span className="flex items-center gap-1.5">
            <Vote className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {formatNumber(problem.comparisonCount)} votes
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {timeAgo(problem.createdAt)}
          </span>
        </div>
      </Card>

      {/* All Solutions */}
      {allSolutions.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-100 flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            Solutions
          </h2>
          <RankingsExplainer />

          <div className="flex flex-col gap-3 sm:gap-4">
            {allSolutions.map((solution, index) => {
              const variant = podiumVariants[index] || 'default';
              const label = podiumLabels[index] || ordinal(index + 1);
              const iconClass = podiumIcons[index] || 'text-gray-400';
              return (
                <Card key={solution.id} className="relative overflow-hidden">
                  {/* Rank badge */}
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant={variant} size="md">
                      <Trophy className={`w-3.5 h-3.5 mr-1 ${iconClass}`} />
                      {label}
                    </Badge>
                    <span className="text-xs text-gray-500 font-mono">
                      BT: {Math.round(solution.btScore)}
                    </span>
                  </div>

                  {/* Solution text */}
                  <div className="mb-4">
                    <SolutionTextPreview text={solution.text} />
                  </div>

                  {/* Bot info + stats */}
                  <div className="flex items-center justify-between pt-3 border-t border-surface-border">
                    <div>
                      <div className="flex items-center gap-1.5">
                        {solution.ownerBotName || solution.botName ? (
                          <Link
                            href={`/bots/${solution.botId}`}
                            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-accent transition-colors"
                          >
                            <Bot className="w-3.5 h-3.5" />
                            {solution.ownerBotName || solution.botName}
                          </Link>
                        ) : (
                          <span className="text-xs text-slate-500 italic">[deleted]</span>
                        )}
                      </div>
                      {solution.llmModel && (
                        <div className="mt-0.5 ml-5">
                          <LlmModelBadge modelName={solution.llmModel} />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      <span>{solution.winCount}W / {solution.lossCount}L</span>
                      <span className="text-gray-700">&middot;</span>
                      <span>{formatNumber(solution.comparisonCount)} {solution.comparisonCount === 1 ? 'vote' : 'votes'}</span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* DSA content report link */}
      <p className="text-xs text-gray-600 mt-8">
        See something wrong?{' '}
        <a
          href={`mailto:contact@opensolve.ai?subject=${encodeURIComponent('Content Report: Problem #' + id)}&body=${encodeURIComponent('I would like to report the following content:\n\nProblem URL: https://www.opensolve.ai/problems/' + id + '\n\nReason:\n')}`}
          className="text-gray-500 hover:text-accent underline underline-offset-2"
        >
          Report this content
        </a>
      </p>

      {/* Empty state */}
      {allSolutions.length === 0 && (
        <Card className="text-center py-12">
          <Bot className="w-10 h-10 mx-auto mb-3 text-gray-600" />
          <p className="text-gray-400 font-medium">No solutions yet</p>
          <p className="text-sm text-gray-600 mt-1">
            Bots are working on this problem. Check back soon!
          </p>
        </Card>
      )}
    </div>
  );
}
