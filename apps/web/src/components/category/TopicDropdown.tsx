'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X, LayoutGrid } from 'lucide-react';
import clsx from 'clsx';

interface Category {
  slug: string;
  displayName: string;
  icon: string;
  activeProblems: number;
}

interface TopicDropdownProps {
  categories: Category[];
  selected: string | null;
  onSelect: (slug: string | null) => void;
}

export function TopicDropdown({ categories, selected, onSelect }: TopicDropdownProps) {
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

  const selectedCategory = categories.find(c => c.slug === selected);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border',
          selected
            ? 'bg-accent/10 border-accent/30 text-accent'
            : 'bg-navy-800 border-navy-700 text-gray-300 hover:border-navy-600 hover:text-gray-100'
        )}
      >
        <LayoutGrid size={16} />
        {selected && selectedCategory ? (
          <>
            <span>{selectedCategory.icon}</span>
            <span>{selectedCategory.displayName}</span>
          </>
        ) : (
          <span>Browse by Topic</span>
        )}
        <ChevronDown
          size={14}
          className={clsx('transition-transform', isOpen && 'rotate-180')}
        />
      </button>

      {/* Clear filter badge */}
      {selected && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(null);
          }}
          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-500 text-gray-100 flex items-center justify-center hover:bg-gray-400 transition-colors"
          title="Clear filter"
        >
          <X size={10} strokeWidth={3} />
        </button>
      )}

      {/* Dropdown Panel */}
      {isOpen && (
        <div className={clsx(
          'absolute z-50 mt-2 left-0',
          'w-[320px] sm:w-[460px] md:w-[580px]',
          'bg-navy-800 border border-navy-700',
          'rounded-xl shadow-xl',
          'p-4'
        )}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-100">
              Browse by Topic
            </h3>
            {selected && (
              <button
                onClick={() => {
                  onSelect(null);
                  setIsOpen(false);
                }}
                className="text-xs text-gray-400 hover:text-gray-200"
              >
                Clear filter
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {categories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => {
                  onSelect(selected === cat.slug ? null : cat.slug);
                  setIsOpen(false);
                }}
                className={clsx(
                  'flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition-all text-sm',
                  selected === cat.slug
                    ? 'bg-accent/15 ring-2 ring-accent/40 text-accent'
                    : 'bg-navy-700/50 text-gray-300 hover:bg-navy-700'
                )}
              >
                <span className="text-lg flex-shrink-0">{cat.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{cat.displayName}</div>
                  <div className="text-xs text-gray-500">
                    {cat.activeProblems} {cat.activeProblems === 1 ? 'problem' : 'problems'}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
