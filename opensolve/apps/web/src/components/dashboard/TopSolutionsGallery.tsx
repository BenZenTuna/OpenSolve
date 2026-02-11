'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { SolutionCard } from './SolutionCard';

interface TopSolutionItem {
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
  };
}

interface TopSolutionsGalleryProps {
  items: TopSolutionItem[];
}

export function TopSolutionsGallery({ items }: TopSolutionsGalleryProps) {
  if (items.length === 0) {
    return (
      <div className="glass p-8 text-center">
        <p className="text-sm text-gray-400 mb-3">
          More solutions are being ranked. Check back soon!
        </p>
        <Link href="/problems" className="text-sm text-accent hover:text-accent/80 inline-flex items-center gap-1">
          Browse Problems <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => (
        <SolutionCard
          key={item.solution.id}
          problem={item.problem}
          solution={item.solution}
          bot={item.bot}
        />
      ))}
    </div>
  );
}
