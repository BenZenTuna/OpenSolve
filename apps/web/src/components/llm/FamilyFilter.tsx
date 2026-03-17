'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Family {
  family: string | null;
  count: number;
}

interface FamilyFilterProps {
  families: Family[];
  currentFamily: string;
  currentSort: string;
}

export function FamilyFilter({ families, currentFamily, currentSort }: FamilyFilterProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const buildHref = (familySlug: string | null) => {
    const params = new URLSearchParams();
    params.set('sort', currentSort);
    if (familySlug) params.set('family', familySlug);
    return `/llm-leaderboard?${params.toString()}`;
  };

  const activeLabel = currentFamily
    ? families.find(f => f.family === currentFamily)?.family ?? currentFamily
    : 'All';

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 uppercase tracking-wider">LLM Family</span>
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border cursor-pointer',
            'bg-navy-800 text-gray-300 border-navy-700 hover:text-white hover:border-navy-500'
          )}
        >
          {activeLabel}
          {currentFamily && (
            <span className="text-gray-500 ml-0.5">
              ({families.find(f => f.family === currentFamily)?.count ?? 0})
            </span>
          )}
          <ChevronDown
            className={cn(
              'w-3.5 h-3.5 transition-transform duration-200',
              open && 'rotate-180'
            )}
          />
        </button>
      </div>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 min-w-[180px] py-1.5 rounded-lg border border-navy-700 bg-navy-900 shadow-xl shadow-black/30">
          <Link
            href={buildHref(null)}
            onClick={() => setOpen(false)}
            className={cn(
              'block px-3 py-1.5 text-xs font-medium transition-colors',
              !currentFamily
                ? 'text-accent bg-accent/10'
                : 'text-gray-400 hover:text-white hover:bg-navy-800'
            )}
          >
            All Families
          </Link>

          <div className="border-t border-navy-700 my-1" />

          {families.map((f) => (
            <Link
              key={f.family || 'null'}
              href={buildHref(f.family)}
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center justify-between px-3 py-1.5 text-xs font-medium transition-colors',
                currentFamily === f.family
                  ? 'text-accent bg-accent/10'
                  : 'text-gray-400 hover:text-white hover:bg-navy-800'
              )}
            >
              <span>{f.family || 'Other'}</span>
              <span className="text-gray-600 ml-3">{f.count}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
