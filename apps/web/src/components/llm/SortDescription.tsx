'use client';

import { useState } from 'react';

interface SortDescriptionProps {
  label: string;
  title: string;
  detail: string;
}

export function SortDescription({ label, title, detail }: SortDescriptionProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="ml-1">
      <p className="text-sm text-gray-300 font-medium">{label}: {title}</p>
      {/* Desktop: always show detail */}
      <p className="hidden sm:block text-xs text-gray-500 mt-0.5 leading-relaxed">{detail}</p>
      {/* Mobile: toggle detail */}
      {expanded ? (
        <p className="sm:hidden text-xs text-gray-500 mt-0.5 leading-relaxed">{detail}</p>
      ) : (
        <button
          onClick={() => setExpanded(true)}
          className="sm:hidden text-xs text-accent mt-0.5 cursor-pointer"
        >
          read more
        </button>
      )}
    </div>
  );
}
