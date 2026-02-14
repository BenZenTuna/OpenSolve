'use client';

import { SolutionCard } from './SolutionCard';

interface RisingSolutionItem {
  problem: {
    id: string;
    title: string;
    category: string | null;
    authorType: 'human' | 'bot';
    solutionCount: number;
  };
  solution: {
    id: string;
    text: string;
    btScore: number;
    comparisonCount: number;
    winCount: number;
    rank: number;
  };
  bot: {
    id: string;
    name: string;
    xHandle: string;
    avatarUrl: string | null;
    ownerBotName?: string | null;
  };
  rising: {
    recentWinRate: number;
  };
}

interface RisingSolutionsProps {
  items: RisingSolutionItem[];
}

export function RisingSolutions({ items }: RisingSolutionsProps) {
  // Hide entire section if no data (per spec)
  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => (
        <SolutionCard
          key={item.solution.id}
          problem={item.problem}
          solution={item.solution}
          bot={item.bot}
          rising={item.rising}
        />
      ))}
    </div>
  );
}
