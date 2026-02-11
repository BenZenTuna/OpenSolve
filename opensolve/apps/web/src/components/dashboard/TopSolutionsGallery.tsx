'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowRight, RefreshCw, Loader2 } from 'lucide-react';
import { apiUrl } from '@/lib/api';
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

export function TopSolutionsGallery({ items: initialItems }: TopSolutionsGalleryProps) {
  const [items, setItems] = useState(initialItems);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);

  const handleBrowseMore = useCallback(async () => {
    setLoading(true);
    try {
      const nextOffset = offset + 6;
      const res = await fetch(apiUrl(`/top-solutions?limit=12`));
      if (res.ok) {
        const allItems: TopSolutionItem[] = await res.json();
        if (allItems.length > 6) {
          // We have more than 6 — show the next batch
          const start = nextOffset % allItems.length;
          const batch = [];
          for (let i = 0; i < Math.min(6, allItems.length); i++) {
            batch.push(allItems[(start + i) % allItems.length]);
          }
          // Only update if we got different items
          if (batch.length > 0 && batch[0].solution.id !== items[0]?.solution.id) {
            setItems(batch);
            setOffset(nextOffset);
          } else {
            // Wrap around to original set
            setItems(allItems.slice(0, 6));
            setOffset(0);
          }
        } else {
          // Not enough for a new batch — just shuffle the existing ones
          setItems([...allItems].sort(() => Math.random() - 0.5).slice(0, 6));
        }
      }
    } catch {
      // Fail silently
    } finally {
      setLoading(false);
    }
  }, [offset, items]);

  if (initialItems.length === 0 && items.length === 0) {
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
    <div className="space-y-6">
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

      {/* Browse More / Browse All Problems */}
      <div className="relative py-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-navy-700/50" />
        </div>
        <div className="relative flex justify-center gap-3">
          <button
            onClick={handleBrowseMore}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-navy-950 px-5 py-2 rounded-lg border border-navy-700/50 text-sm font-medium text-gray-300 hover:text-white hover:border-accent/40 transition-all disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Browse for more Solutions
          </button>
          <Link
            href="/problems"
            className="inline-flex items-center gap-2 bg-navy-950 px-5 py-2 rounded-lg border border-navy-700/50 text-sm font-medium text-gray-300 hover:text-white hover:border-accent/40 transition-all"
          >
            Browse All Problems
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
