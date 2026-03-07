'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CATEGORY_GROUP_DEFINITIONS, getCategoriesByGroup } from '@opensolve/shared/categories';
import type { CategoryGroup } from '@opensolve/shared/categories';

interface GroupTabNavProps {
  activeGroup: string | null;
  activeCategory: string | null;
}

const GROUP_EMOJI: Record<string, string> = {
  everyday: '🏠',
  world: '🌍',
  professional: '🔬',
};

const GROUPS = [
  { key: null as string | null, label: 'All Questions', emoji: '✨' },
  ...CATEGORY_GROUP_DEFINITIONS.map(g => ({
    key: g.id as string | null,
    label: g.label,
    emoji: GROUP_EMOJI[g.id] ?? '📂',
  })),
];

export function GroupTabNav({ activeGroup, activeCategory }: GroupTabNavProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close panel on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenGroup(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function navigate(updates: Record<string, string | null>) {
    const p = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v === null) p.delete(k);
      else p.set(k, v);
    }
    p.delete('page');
    const qs = p.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ''}`);
  }

  function handleTabClick(groupKey: string | null) {
    navigate({ group: groupKey, category: null });
    setOpenGroup(null);
  }

  function handleChevronClick(e: React.MouseEvent, groupKey: string) {
    e.stopPropagation();
    setOpenGroup(prev => (prev === groupKey ? null : groupKey));
  }

  function handleCategorySelect(slug: string) {
    navigate({ category: activeCategory === slug ? null : slug });
    setOpenGroup(null);
  }

  return (
    <div ref={containerRef} className="relative flex flex-wrap gap-2">
      {GROUPS.map(({ key, label, emoji }) => {
        const isActiveGroup = key === null ? !activeGroup : activeGroup === key;
        const isOpen = openGroup === key;
        const hasSubCats = key !== null;
        const groupCats = key
          ? getCategoriesByGroup(key as CategoryGroup)
          : [];
        const activeCatInGroup = groupCats.find(c => c.slug === activeCategory);

        return (
          <div key={String(key)} className="relative">
            {/* Tab pill */}
            <div
              className={cn(
                'flex items-center rounded-full border text-sm font-medium transition-all overflow-hidden',
                isActiveGroup
                  ? 'bg-accent/15 border-accent/40 text-accent'
                  : 'bg-navy-800 border-navy-700 text-gray-300 hover:border-navy-600 hover:text-white'
              )}
            >
              {/* Label — navigates the group */}
              <button
                onClick={() => handleTabClick(key)}
                className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 whitespace-nowrap"
              >
                <span>{emoji}</span>
                <span>{label}</span>
                {activeCatInGroup && (
                  <span className="text-xs bg-accent/20 text-accent px-1.5 py-0.5 rounded-full leading-none">
                    {activeCatInGroup.icon}
                  </span>
                )}
                {isActiveGroup && !activeCatInGroup && (
                  <span className="text-accent text-xs leading-none">✓</span>
                )}
              </button>

              {/* Chevron — only on groups with sub-categories */}
              {hasSubCats && (
                <button
                  onClick={(e) => handleChevronClick(e, key!)}
                  className={cn(
                    'flex items-center justify-center pr-2.5 pl-0.5 py-1.5 transition-colors',
                    isOpen
                      ? 'text-accent'
                      : isActiveGroup
                      ? 'text-accent/60 hover:text-accent'
                      : 'text-gray-500 hover:text-gray-300'
                  )}
                  aria-label={`Show ${label} topics`}
                >
                  <ChevronDown
                    size={13}
                    strokeWidth={2.5}
                    className={cn(
                      'transition-transform duration-200',
                      isOpen && 'rotate-180'
                    )}
                  />
                </button>
              )}
            </div>

            {/* Floating category panel */}
            {hasSubCats && isOpen && groupCats.length > 0 && (
              <div
                className={cn(
                  'absolute top-full left-0 mt-2 z-50',
                  'min-w-[260px] sm:min-w-[340px]',
                  'bg-navy-800 border border-navy-700 rounded-xl shadow-xl',
                  'p-3'
                )}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    {label}
                  </span>
                  {activeCatInGroup && (
                    <button
                      onClick={() => {
                        navigate({ category: null });
                        setOpenGroup(null);
                      }}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-200 transition-colors"
                    >
                      <X size={10} strokeWidth={3} />
                      Clear
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {groupCats.map(cat => (
                    <button
                      key={cat.slug}
                      onClick={() => handleCategorySelect(cat.slug)}
                      className={cn(
                        'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all',
                        activeCategory === cat.slug
                          ? 'bg-accent/15 ring-1 ring-accent/40 text-accent'
                          : 'bg-navy-700/60 text-gray-300 hover:bg-navy-700 hover:text-white'
                      )}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.displayName}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
