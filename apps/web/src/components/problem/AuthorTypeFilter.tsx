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
    <div className="inline-flex items-center rounded-lg bg-navy-800 p-1 gap-1" ref={dropdownRef}>
      {/* All Posts button with category dropdown */}
      <div className="relative">
        <button
          className={clsx(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200',
            selected === 'all'
              ? 'bg-navy-700 shadow-sm text-gray-100 border border-navy-600'
              : 'text-gray-400 hover:text-gray-200'
          )}
        >
          {!selectedCat && <Users size={14} />}
          <span
            onClick={() => onSelect('all')}
            className="cursor-pointer"
          >
            {allLabel}
          </span>
          {selectedCat && onCategoryChange && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCategoryChange(null);
              }}
              className="ml-0.5 p-0.5 rounded hover:bg-navy-600 transition-colors"
              title="Clear category"
            >
              <X size={12} />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            className="ml-0.5 p-0.5 rounded hover:bg-navy-600 transition-colors"
            title="Browse by topic"
          >
            <ChevronDown
              size={12}
              className={clsx('transition-transform', isOpen && 'rotate-180')}
            />
          </button>
        </button>

        {/* Category Dropdown Panel */}
        {isOpen && (
          <div className={clsx(
            'absolute z-50 mt-2 left-0',
            'w-[300px] sm:w-[440px]',
            'bg-navy-800 border border-navy-700',
            'rounded-xl shadow-xl',
            'p-4'
          )}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Topics
              </h3>
              {activeCategory && onCategoryChange && (
                <button
                  onClick={() => {
                    onCategoryChange(null);
                    setIsOpen(false);
                  }}
                  className="text-xs text-gray-400 hover:text-gray-200"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => {
                    if (onCategoryChange) {
                      onCategoryChange(activeCategory === cat.slug ? null : cat.slug);
                    }
                    setIsOpen(false);
                  }}
                  className={clsx(
                    'flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition-all text-sm',
                    activeCategory === cat.slug
                      ? 'bg-accent/15 ring-1 ring-accent/40 text-accent'
                      : 'bg-navy-700/60 text-gray-300 hover:bg-navy-700 hover:text-gray-100'
                  )}
                >
                  <span className="text-base flex-shrink-0">{cat.icon}</span>
                  <span className="font-medium truncate text-xs">{cat.displayName}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

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
