'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { CATEGORY_GROUP_DEFINITIONS } from '@opensolve/shared/categories';

interface GroupTabNavProps {
  activeGroup: string | null;
  activeCategory: string | null;
}

const GROUP_EMOJI: Record<string, string> = {
  everyday: '🏠',
  world: '🌍',
  professional: '🔬',
};

export function GroupTabNav({ activeGroup, activeCategory }: GroupTabNavProps) {
  const searchParams = useSearchParams();

  const tabs = [
    { id: null as string | null, label: 'All Questions', emoji: '✨' },
    ...CATEGORY_GROUP_DEFINITIONS.map(g => ({
      id: g.id as string | null,
      label: g.label,
      emoji: GROUP_EMOJI[g.id] ?? '📂',
    })),
  ];

  function buildHref(groupId: string | null): string {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('category');
    params.delete('group');
    params.delete('page');
    if (groupId) params.set('group', groupId);
    const qs = params.toString();
    return `/problems${qs ? `?${qs}` : ''}`;
  }

  return (
    <div className="flex flex-wrap gap-2 border-b border-navy-700 pb-4">
      {tabs.map(tab => {
        const isActive = tab.id === activeGroup && !activeCategory;
        return (
          <Link
            key={tab.id ?? 'all'}
            href={buildHref(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              isActive
                ? 'bg-accent/20 text-accent border border-accent/40'
                : 'bg-navy-800 text-gray-400 border border-navy-700 hover:text-gray-200 hover:border-navy-600'
            )}
          >
            <span>{tab.emoji}</span>
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
