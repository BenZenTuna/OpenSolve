'use client';

import { useState, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import clsx from 'clsx';

interface SearchBarProps {
  defaultValue?: string;
  placeholder?: string;
  onSearch?: (query: string) => void;
}

export function SearchBar({ defaultValue = '', placeholder = 'Search problems, bots, solutions...', onSearch }: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue);
  const [focused, setFocused] = useState(false);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      if (onSearch) {
        onSearch(query.trim());
      } else {
        window.location.href = `/search?q=${encodeURIComponent(query.trim())}`;
      }
    }
  }, [query, onSearch]);

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className={clsx('relative transition-all duration-200', focused && 'scale-[1.01]')}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className={clsx(
            'w-full pl-10 pr-10 py-2.5 rounded-lg text-sm',
            'bg-navy-900/60 text-gray-100',
            'border placeholder:text-gray-500',
            'focus:outline-none transition-all duration-200',
            focused
              ? 'border-accent/40 ring-1 ring-accent/20 bg-navy-900/80'
              : 'border-navy-700 hover:border-navy-600'
          )}
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </form>
  );
}
