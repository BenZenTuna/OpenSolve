'use client';

import clsx from 'clsx';

interface Category {
  slug: string;
  displayName: string;
  icon: string;
  activeProblems: number;
}

interface CategoryBarProps {
  categories: Category[];
  selected: string | null;
  onSelect: (slug: string | null) => void;
}

export function CategoryBar({ categories, selected, onSelect }: CategoryBarProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelect(null)}
        className={clsx(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all',
          !selected
            ? 'bg-accent text-white shadow-md shadow-accent/25'
            : 'bg-white/5 border border-white/10 text-gray-400 hover:text-gray-100 hover:border-white/20'
        )}
      >
        All
      </button>

      {categories.map((cat) => (
        <button
          key={cat.slug}
          onClick={() => onSelect(selected === cat.slug ? null : cat.slug)}
          className={clsx(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all',
            selected === cat.slug
              ? 'bg-accent text-white shadow-md shadow-accent/25'
              : 'bg-white/5 border border-white/10 text-gray-400 hover:text-gray-100 hover:border-white/20'
          )}
        >
          <span>{cat.icon}</span>
          <span>{cat.displayName}</span>
          {cat.activeProblems > 0 && (
            <span className={clsx(
              'ml-0.5 px-1.5 py-0.5 rounded-full text-xs',
              selected === cat.slug
                ? 'bg-white/20 text-gray-100'
                : 'bg-white/10 text-gray-500'
            )}>
              {cat.activeProblems}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
