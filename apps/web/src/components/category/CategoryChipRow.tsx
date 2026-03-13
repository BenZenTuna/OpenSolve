'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { CATEGORIES } from '@opensolve/shared/categories';

interface CategoryChipRowProps {
  activeCategory: string | null;
}

export function CategoryChipRow({ activeCategory }: CategoryChipRowProps) {
  const searchParams = useSearchParams();

  function buildCategoryHref(slug: string): string {
    const params = new URLSearchParams(searchParams.toString());
    params.set('category', slug);
    params.delete('page');
    const qs = params.toString();
    return `/problems?${qs}`;
  }

  function buildAllHref(): string {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('category');
    params.delete('page');
    const qs = params.toString();
    return `/problems${qs ? `?${qs}` : ''}`;
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={buildAllHref()}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border',
          !activeCategory
            ? 'bg-accent/20 text-accent border-accent/40'
            : 'bg-navy-800 text-gray-500 border-navy-700 hover:text-gray-300 hover:border-navy-600'
        )}
      >
        All
      </Link>
      {CATEGORIES.map(cat => (
        <Link
          key={cat.slug}
          href={buildCategoryHref(cat.slug)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border',
            activeCategory === cat.slug
              ? 'bg-accent/20 text-accent border-accent/40'
              : 'bg-navy-800 text-gray-500 border-navy-700 hover:text-gray-300 hover:border-navy-600'
          )}
        >
          <span>{cat.icon}</span>
          {cat.displayName}
        </Link>
      ))}
    </div>
  );
}
