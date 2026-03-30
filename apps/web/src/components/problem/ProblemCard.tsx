import Link from 'next/link';
import { MessageSquare, ArrowUpDown, Clock, Bot, User } from 'lucide-react';
import { CategoryBadge } from '@/components/category/CategoryBadge';
import { AiGeneratedBadge } from '@/components/AiGeneratedBadge';
import { timeAgo } from '@/lib/utils';

interface ProblemCardProps {
  problem: {
    id: string;
    title: string;
    description: string;
    status: string;
    category: string | null;
    authorType: string;
    solutionCount: number;
    comparisonCount: number;
    greenFlags: number;
    createdAt: string;
    topSolution: {
      text: string;
      btScore: number;
      botName: string | null;
    } | null;
  };
}

const STATUS_BORDER: Record<string, string> = {
  pending: 'border-l-amber-500',
  approved: 'border-l-blue-500',
  active: 'border-l-emerald-500',
  mature: 'border-l-purple-500',
  rejected: 'border-l-red-500',
};

const STATUS_PILL: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-400',
  approved: 'bg-blue-500/15 text-blue-400',
  active: 'bg-emerald-500/15 text-emerald-400',
  mature: 'bg-purple-500/15 text-purple-400',
  rejected: 'bg-red-500/15 text-red-400',
};

export function ProblemCard({ problem }: ProblemCardProps) {
  const isHuman = problem.authorType === 'human';
  const borderClass = STATUS_BORDER[problem.status] || 'border-l-gray-500';
  const pillClass = STATUS_PILL[problem.status] || 'bg-gray-500/15 text-gray-400';

  return (
    <Link href={`/problems/${problem.id}`} className="block group">
      <div className={`glass rounded-xl border-l-[3px] ${borderClass} p-3 sm:p-5 hover:border-navy-600/50 hover:bg-navy-700/40 transition-all`}>

        {/* Row 1: Category + Status + Timestamp */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {problem.category && <CategoryBadge slug={problem.category} size="sm" />}
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${pillClass}`}>
            {problem.status.charAt(0).toUpperCase() + problem.status.slice(1)}
          </span>
          <span className="ml-auto text-[11px] sm:text-xs text-gray-500 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {timeAgo(problem.createdAt)}
          </span>
        </div>

        {/* Row 2: Title */}
        <h3 className="mt-1.5 sm:mt-2.5 text-base sm:text-lg font-medium text-gray-100 line-clamp-2 break-words group-hover:text-accent transition-colors">
          {problem.title}
        </h3>

        {/* === MOBILE: merged author + stats on one line === */}
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-400 sm:hidden">
          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${isHuman ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300'}`}>
            {isHuman ? <User size={9} /> : <Bot size={9} />}
          </span>
          <span>{isHuman ? 'Posted by human' : `Posted by ${problem.topSolution?.botName || 'bot'}`}</span>
          <span className="text-gray-600">&middot;</span>
          <span>{problem.solutionCount} solutions</span>
          <span className="text-gray-600">&middot;</span>
          <span>{problem.comparisonCount} votes</span>
        </div>

        {/* === DESKTOP: separate author line === */}
        <div className="mt-1.5 hidden sm:flex items-center gap-2 text-sm text-gray-400">
          <span className={`w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${isHuman ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300'}`}>
            {isHuman ? <User size={10} /> : <Bot size={10} />}
          </span>
          <span>{isHuman ? 'Posted by a human' : `Created by ${problem.topSolution?.botName || 'an AI agent'}`}</span>
        </div>
        {/* EU AI Act: label for bot-authored post (desktop) */}
        {!isHuman && <AiGeneratedBadge className="hidden sm:block" />}

        {/* EU AI Act: label for bot-authored post (mobile) */}
        {!isHuman && <AiGeneratedBadge className="sm:hidden" />}

        {/* === MOBILE: compact top answer preview === */}
        {problem.topSolution && (
          <div className="sm:hidden">
            <p className="mt-1.5 text-xs text-gray-400 line-clamp-2">
              <Bot size={10} className="inline mr-1 text-accent" />
              <span className="text-gray-300 font-medium">{problem.topSolution.botName || 'Unknown'}:</span>{' '}
              {problem.topSolution.text}
            </p>
            {/* EU AI Act: label for bot-authored solution preview (mobile) */}
            <AiGeneratedBadge />
          </div>
        )}
        {!problem.topSolution && problem.status === 'pending' && (
          <p className="mt-1.5 text-xs text-gray-500 sm:hidden">
            Safety review: {problem.greenFlags}/3 approvals
          </p>
        )}

        {/* === DESKTOP: full solution preview box === */}
        <div className="mt-3 rounded-lg bg-navy-900 border border-navy-700 p-3 hidden sm:block">
          {problem.topSolution ? (
            <>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="w-5 h-5 rounded-full bg-accent/15 text-accent flex items-center justify-center shrink-0">
                  <Bot size={11} />
                </span>
                <span className="text-xs font-medium text-gray-300">
                  Top answer by {problem.topSolution.botName || 'Unknown'}
                </span>
              </div>
              <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed">
                {problem.topSolution.text}
              </p>
              {/* EU AI Act: label for bot-authored solution preview (desktop) */}
              <AiGeneratedBadge />
            </>
          ) : problem.status === 'pending' ? (
            <div className="text-center py-1">
              <p className="text-sm text-gray-500">
                Awaiting safety review — {problem.greenFlags}/3 approvals received
              </p>
              <div className="flex items-center justify-center gap-1.5 mt-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${i < problem.greenFlags ? 'bg-emerald-400' : 'bg-gray-700'}`}
                  />
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-1">
              Awaiting AI agent review — agents will start competing soon
            </p>
          )}
        </div>

        {/* === DESKTOP: stats row === */}
        <div className="mt-3 hidden sm:flex items-center gap-4 text-sm text-gray-400">
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <MessageSquare className="w-3.5 h-3.5" />
            {problem.solutionCount} solution{problem.solutionCount !== 1 ? 's' : ''}
          </span>
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <ArrowUpDown className="w-3.5 h-3.5" />
            {problem.comparisonCount} vote{problem.comparisonCount !== 1 ? 's' : ''}
          </span>
          {problem.status === 'mature' && (
            <span className="flex items-center gap-1.5 text-purple-400 whitespace-nowrap">
              <Clock className="w-3.5 h-3.5" />
              Rankings stable
            </span>
          )}
          {problem.status === 'active' && problem.solutionCount > 0 && (
            <span className="flex items-center gap-1.5 text-emerald-400 whitespace-nowrap">
              <Bot className="w-3.5 h-3.5" />
              Agents competing
            </span>
          )}
        </div>

      </div>
    </Link>
  );
}
