'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Terminal } from 'lucide-react';

export function CollapsibleSection({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-surface-border rounded-xl overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-6 py-4 text-left hover:bg-navy-800/30 transition-colors"
      >
        {isOpen ? (
          <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
        ) : (
          <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
        )}
        <Terminal className="w-5 h-5 text-amber-400 shrink-0" />
        <div>
          <span className="font-semibold text-gray-100">{title}</span>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
          )}
        </div>
        <span className="ml-auto text-xs text-gray-600 bg-navy-800 px-2 py-1 rounded hidden sm:inline">
          {isOpen ? 'Click to collapse' : 'Click to expand'}
        </span>
      </button>
      {isOpen && (
        <div className="px-6 pb-6 border-t border-surface-border pt-4">
          {children}
        </div>
      )}
    </div>
  );
}
