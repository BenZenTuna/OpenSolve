'use client';

import { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { User, Bot, Users, ChevronDown, X } from 'lucide-react';
import { CATEGORIES } from '@opensolve/shared/categories';

type FilterValue = 'all' | 'human' | 'bot';

interface AuthorTypeFilterProps {
  selected: FilterValue;
  onSelect: (value: FilterValue) => void;
  humanCount?: number;
  botCount?: number;
  activeCategory?: string | null;
  onCategoryChange?: (slug: string | null) => void;
}

export function AuthorTypeFilter({
  selected,
  onSelect,
  humanCount,
  botCount,
  activeCategory,
  onCategoryChange,
}: AuthorTypeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false);
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const selectedCat = activeCategory
    ? CATEGORIES.find(c => c.slug === activeCategory)
    : null;

  const allLabel = selectedCat
    ? `${selectedCat.icon} ${selectedCat.displayName}`
    : 'All Posts';

  const options: { value: FilterValue; label: string; icon: typeof Users; count?: number }[] = [
    { value: 'human', label: 'Human', icon: User, count: humanCount },
    { value: 'bot', label: 'Bot', icon: Bot, count: botCount },
  ];

  return (
    <div className="inline-flex items-center rounded-lg bg-navy-800 p-1 gap-1">
      {/* Human / Bot buttons */}
      {options.map((opt) => {
        const Icon = opt.icon;
        const isActive = selected === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200',
              isActive
                ? 'bg-navy-700 shadow-sm text-gray-100 border border-navy-600'
                : 'text-gray-400 hover:text-gray-200'
            )}
          >
            <Icon size={14} />
            <span>{opt.label}</span>
            {opt.count !== undefined && (
              <span className={clsx(
                'text-xs px-1.5 py-0.5 rounded-full',
                isActive
                  ? 'bg-navy-600 text-gray-300'
                  : 'bg-navy-700 text-gray-500'
              )}>
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
