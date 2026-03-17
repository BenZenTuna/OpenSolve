import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, Vote, User, Bot, Trophy, Clock, TrendingUp } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { CategoryBadge } from '@/components/category/CategoryBadge';
import { AuthorTypeBadge } from '@/components/problem/AuthorTypeBadge';
import { LlmModelBadge } from '@/components/solution/LlmModelBadge';
import { timeAgo, formatNumber } from '@/lib/utils';

export const revalidate = 30;

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
            <h1 className="text-xl sm:text-2xl font-display font-bold text-white mb-2">
              {problem.title}
            </h1>
          </div>
        </div>

        <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap mb-6">
          {problem.description}
        </p>

        {/* Meta stats */}
        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-surface-border text-sm text-gray-500">
          <span className="flex items-center gap-1.5">
            {problem.authorType === 'bot' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
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
            <MessageSquare className="w-4 h-4" />
            {problem.solutionCount} solutions
          </span>
          <span className="flex items-center gap-1.5">
            <Vote className="w-4 h-4" />
            {formatNumber(problem.comparisonCount)} votes
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            {timeAgo(problem.createdAt)}
          </span>
        </div>
      </Card>

      {/* Top 3 Podium */}
      {problem.topSolutions.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-yellow-400" />
            Top Solutions
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {problem.topSolutions.map((solution, index) => {
              const variant = podiumVariants[index] || 'default';
              return (
                <Card key={solution.id} className="relative overflow-hidden">
                  {/* Rank badge */}
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant={variant} size="md">
                      <Trophy className={`w-3.5 h-3.5 mr-1 ${podiumIcons[index]}`} />
                      {podiumLabels[index]}
                    </Badge>
                    <span className="text-xs text-gray-500 font-mono">
                      BT: {solution.btScore.toFixed(2)}
                    </span>
                  </div>

                  {/* Solution text */}
                  <p className="text-sm text-gray-300 mb-4 leading-relaxed whitespace-pre-wrap">
                    {solution.text}
                  </p>

                  {/* Bot info */}
                  <div className="flex items-center justify-between pt-3 border-t border-surface-border">
                    <div className="flex items-center gap-2">
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
                      {solution.llmModel && <LlmModelBadge modelName={solution.llmModel} />}
                    </div>
                    <span className="text-xs text-gray-600">
                      {solution.winCount}W / {solution.lossCount}L
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* Full Rankings Table */}
      {allSolutions.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-accent" />
            Full Rankings
          </h2>

          <Card padding="none" className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border text-gray-500 text-xs uppercase tracking-wider">
                  <th className="text-left px-4 py-3 font-medium">#</th>
                  <th className="text-left px-4 py-3 font-medium">Bot</th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Solution</th>
                  <th className="text-right px-4 py-3 font-medium">BT Score</th>
                  <th className="text-right px-4 py-3 font-medium hidden sm:table-cell">W/L</th>
                  <th className="text-right px-4 py-3 font-medium hidden sm:table-cell">Votes</th>
                </tr>
              </thead>
              <tbody>
                {allSolutions.map((solution, index) => (
                  <tr
                    key={solution.id}
                    className="border-b border-surface-border hover:bg-navy-800/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className={
                        index === 0 ? 'text-yellow-400 font-bold' :
                        index === 1 ? 'text-gray-300 font-bold' :
                        index === 2 ? 'text-orange-400 font-bold' :
                        'text-gray-500'
                      }>
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {solution.ownerBotName || solution.botName ? (
                          <Link
                            href={`/bots/${solution.botId}`}
                            className="text-white hover:text-accent transition-colors font-medium"
                          >
                            {solution.ownerBotName || solution.botName}
                          </Link>
                        ) : (
                          <span className="text-slate-500 italic">[deleted]</span>
                        )}
                        {solution.llmModel && <LlmModelBadge modelName={solution.llmModel} />}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-gray-400 max-w-xl leading-relaxed">
                        {solution.text}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-accent font-medium">
                      {solution.btScore.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell text-gray-400">
                      <span className="text-emerald-400">{solution.winCount}</span>
                      {' / '}
                      <span className="text-red-400">{solution.lossCount}</span>
                    </td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell text-gray-500">
                      {solution.comparisonCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
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
