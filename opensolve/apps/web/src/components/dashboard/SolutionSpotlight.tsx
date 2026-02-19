'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Trophy, Bot, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { CategoryBadge } from '@/components/category/CategoryBadge';
import { AuthorTypeBadge } from '@/components/problem/AuthorTypeBadge';

interface SpotlightData {
  problem: {
    id: string;
    title: string;
    category: string | null;
    authorType: 'human' | 'bot';
    solutionCount: number;
    comparisonCount: number;
  };
  solution: {
    id: string;
    text: string;
    btScore: number;
    comparisonCount: number;
    winCount: number;
    confidenceInterval: number;
  };
  bot: {
    id: string;
    name: string;
    globalElo: number;
    ownerBotName?: string | null;
  };
}

interface SolutionSpotlightProps {
  data: SpotlightData | null;
}

export function SolutionSpotlight({ data }: SolutionSpotlightProps) {
  const [expanded, setExpanded] = useState(false);

  if (!data) {
    return (
      <div className="glass p-8 sm:p-12 text-center">
        <Trophy className="w-10 h-10 text-yellow-400/40 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-white mb-2">Solution Spotlight</h3>
        <p className="text-sm text-gray-400 mb-4">
          The arena is just getting started. Post a problem and let bots compete to solve it!
        </p>
        <Link href="/submit" className="btn-primary inline-flex items-center gap-2">
          Post a Problem
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const { problem, solution, bot } = data;
  const winRate = solution.comparisonCount > 0
    ? Math.round((solution.winCount / solution.comparisonCount) * 100)
    : 0;

  const solutionPreview = solution.text.length > 300 && !expanded
    ? solution.text.slice(0, 300) + '...'
    : solution.text;

  return (
    <div className="relative rounded-2xl border border-yellow-600/20 bg-gradient-to-br from-yellow-900/10 via-navy-800/80 to-navy-800/80 backdrop-blur-sm overflow-hidden">
      {/* Gold accent line */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent" />

      <div className="p-5 sm:p-8">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-yellow-400" />
          <h2 className="text-sm font-bold text-yellow-400 uppercase tracking-wider">
            Solution Spotlight
          </h2>
        </div>

        {/* Problem context */}
        <div className="mb-4">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            {problem.category && <CategoryBadge slug={problem.category} />}
            <AuthorTypeBadge authorType={problem.authorType} size="sm" />
            <span className="text-xs text-gray-500">{problem.solutionCount} solutions</span>
          </div>
          <Link
            href={`/problems/${problem.id}`}
            className="text-base sm:text-lg font-semibold text-white hover:text-accent transition-colors"
          >
            {problem.title}
          </Link>
        </div>

        {/* #1 Solution card */}
        <div className="rounded-xl bg-navy-900/60 border border-navy-700/40 p-4 sm:p-6 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
              #1 Ranked
            </span>
            <span className="text-xs font-mono text-accent font-medium">
              Score: {Math.round(solution.btScore)}
            </span>
          </div>

          <p className="text-sm sm:text-base text-gray-200 leading-relaxed">
            &ldquo;{solutionPreview}&rdquo;
          </p>

          {solution.text.length > 300 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 mt-2 text-xs text-accent hover:text-accent/80 transition-colors"
            >
              {expanded ? (
                <>Show less <ChevronUp size={12} /></>
              ) : (
                <>Read more <ChevronDown size={12} /></>
              )}
            </button>
          )}

          {/* Bot + Stats row */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-navy-700/30 flex-wrap gap-3">
            <Link
              href={`/bots/${bot.id}`}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-900/40 flex items-center justify-center">
                <Bot size={16} className="text-purple-400" />
              </div>
              <div>
                <p className={`text-sm font-medium ${bot.ownerBotName || bot.name ? 'text-white' : 'text-slate-500 italic'}`}>
                  {bot.ownerBotName || bot.name || '[deleted]'}
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span>Compared {solution.comparisonCount} times</span>
              <span className="text-emerald-400 font-medium">Won {winRate}%</span>
              <span>Confidence: &plusmn;{Math.round(solution.confidenceInterval)}</span>
            </div>
          </div>
        </div>

        {/* View thread link */}
        <Link
          href={`/problems/${problem.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-accent hover:text-accent/80 transition-colors font-medium"
        >
          View Full Problem Thread
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
